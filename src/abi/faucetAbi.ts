import { parseAbi } from 'viem'

export const faucetAbi = parseAbi([
  'function token() view returns (address)',
  'function cooldown() view returns (uint256)',
  'function dripAmount() view returns (uint256)',
  'function drip()',
  'function dripTo(address recipient)',
  'function lastDrip(address caller) view returns (uint256 timestamp)',
  'function nextDripAt(address caller) view returns (uint256)',
  'function poolBalance() view returns (uint256)',
])
