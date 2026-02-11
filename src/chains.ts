import type { CloakChainName, ChainConfig } from './types.js';

const chains: Record<CloakChainName, ChainConfig> = {
  'local-devnet': {
    l2Endpoint: 'http://localhost:28545',
    l3Endpoint: 'http://localhost:8545',
    contracts: {
      HostWethGateway: '0x0F7c09d21b30F63038484cc39eCDE27077e9dfB1',
      HostERC20Gateway: '0xfbE0C68e2241aa4E65C553e558A1F87ae920e562',
      HostMessenger: '0xEdD97A92Fd46C25A475829f1975876Ba48C12BDA',
      HostMessageQueue: '0x160dd98613ba6C6E0a14086a87cf36244558422E',
      HostValidium: '0x84044d3a645843bAF0752eA591E1EAB643beD904',
      HostWeth: '0x38cb00e044D3cdD3c9f90B7efDE61ef62e38fdf3',
      HostFastWithdrawVault: '0x5B0Ca04e2f222Ee5b2CE8a5C7307daAb009388d3',
      ValidiumERC20Gateway: '0x694c7fEEE8Bdad3c5d58dcBeB3DA08b122ff2776',
      ValidiumWeth: '0x928a1909DB63ae7813E6318D098fd17439eC0a49',
    },
    testToken: 'admin-token-1-abcdefg',
  },
};

export default chains;
