import { TradeType, AMMs } from './constants';
import invariant from 'tiny-invariant';
import { validateAndParseAddress } from './utils';
import { CurrencyAmount, ETHER, Percent, Trade } from './entities';
import { hexlify } from '@ethersproject/bytes';

/**
 * Options for producing the arguments to send call to the router.
 */
export interface TradeOptions {
  /**
   * How much the execution price is allowed to move unfavorably from the trade execution price.
   */
  allowedSlippage: Percent;
  /**
   * How long the swap is valid until it expires, in seconds.
   * This will be used to produce a `deadline` parameter which is computed from when the swap call parameters
   * are generated.
   */
  ttl: number;
  /**
   * The account that should receive the output of the swap.
   */
  recipient: string;

  /**
   * Whether any of the tokens in the path are fee on transfer tokens, which should be handled with special methods
   */
  marginTrade: boolean;
}

export interface TradeOptionsDeadline extends Omit<TradeOptions, 'ttl'> {
  /**
   * When the transaction expires.
   * This is an atlernate to specifying the ttl, for when you do not want to use local time.
   */
  deadline: number;
}

/**
 * The parameters to use in the call to the Uniswap V2 Router to execute a trade.
 */
export interface SwapParameters {
  /**
   * The method to call on the Uniswap V2 Router.
   */
  methodName: string;
  /**
   * The arguments to pass to the method, all hex encoded.
   */
  args: (string | string[])[];
  /**
   * The amount of wei to send in hex.
   */
  value: string;
}

function toHex(currencyAmount: CurrencyAmount) {
  return `0x${currencyAmount.raw.toString(16)}`;
}

function encodeAMMPath(ammPath: AMMs[]) {
  const encoded = hexlify(ammPath.map((amm: AMMs) => (amm === AMMs.UNI || amm === AMMs.PANGOLIN ? 0 : 1)));
  return `${encoded}${'0'.repeat(64 + 2 - encoded.length)}`;
}

/**
 * Represents the Uniswap V2 Router, and has static methods for helping execute trades.
 */
export abstract class Router {
  /**
   * Cannot be constructed.
   */
  private constructor() {
    // do nothing
  }
  /**
   * Produces the on-chain method name to call and the hex encoded parameters to pass as arguments for a given trade.
   * @param trade to produce call parameters for
   * @param options options for the call parameters
   */
  public static swapCallParameters(trade: Trade, options: TradeOptions | TradeOptionsDeadline): SwapParameters {
    const etherIn = trade.inputAmount.currency === ETHER;
    const etherOut = trade.outputAmount.currency === ETHER;
    // the router does not support both ether in and out
    invariant(!(etherIn && etherOut), 'ETHER_IN_OUT');
    invariant(!('ttl' in options) || options.ttl > 0, 'TTL');

    const ZERO_HEX = `0x${'0'.repeat(64)}`;

    const ammPath = trade.route.pairs.map(pair => pair.amm);
    const encodedAmmPath = encodeAMMPath(ammPath);

    const to: string = validateAndParseAddress(options.recipient);
    const amountIn: string = toHex(trade.maximumAmountIn(options.allowedSlippage));
    const amountOut: string = toHex(trade.minimumAmountOut(options.allowedSlippage));
    const path: string[] = trade.route.path.map(token => token.address);
    const deadline =
      'ttl' in options
        ? `0x${(Math.floor(new Date().getTime() / 1000) + options.ttl).toString(16)}`
        : `0x${options.deadline.toString(16)}`;

    let methodName: string;
    let args: (string | string[])[];
    let value: string;
    switch (trade.tradeType) {
      case TradeType.EXACT_INPUT:
        if (etherIn && !options.marginTrade) {
          methodName = 'swapExactETHForTokens';
          // (uint amountOutMin, bytes32 amms, address[] calldata path, address to, uint deadline)
          args = [amountOut, encodedAmmPath, path];
          value = amountIn;
        } else if (etherOut && !options.marginTrade) {
          methodName = 'swapExactTokensForETH';
          // (uint amountIn, uint amountOutMin, bytes32 amms, address[] calldata path, address to, uint deadline)
          args = [amountIn, amountOut, encodedAmmPath, path];
          value = ZERO_HEX;
        } else {
          methodName = 'swapExactTokensForTokens';
          // (uint amountIn, uint amountOutMin, bytes32 amms, ddress[] calldata path, address to, uint deadline)
          args = [amountIn, amountOut, encodedAmmPath, path];
          value = ZERO_HEX;
        }
        break;
      case TradeType.EXACT_OUTPUT:
        if (etherIn && !options.marginTrade) {
          methodName = 'swapETHForExactTokens';
          // (uint amountOut, bytes32 amms, address[] calldata path, address to, uint deadline)
          args = [amountOut, encodedAmmPath, path];
          value = amountIn;
        } else if (etherOut && !options.marginTrade) {
          methodName = 'swapTokensForExactETH';
          // (uint amountOut, uint amountInMax, bytes32 amms, address[] calldata path, address to, uint deadline)
          args = [amountOut, amountIn, encodedAmmPath, path];
          value = ZERO_HEX;
        } else {
          methodName = 'swapTokensForExactTokens';
          // (uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline)
          args = [amountOut, amountIn, encodedAmmPath, path];
          value = ZERO_HEX;
        }
        break;
    }

    if (!options.marginTrade) {
      args.push(to);
    }

    args.push(deadline);

    return {
      methodName,
      args,
      value
    };
  }
}
