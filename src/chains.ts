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

  'sepolia-test-004': {
    l2Endpoint: 'https://sepolia-rpc.scroll.io',
    l3Endpoint: 'https://cloak-devnet-sepolia-test-004.scroll.systems',
    contracts: {
      HostWethGateway: '0xED46830F8C590c182a2a6d4f8E00B99fDF4A80F1',
      HostERC20Gateway: '0xDAbfBE555e3ea13e7d3EB942aa97134Ac2eE153f',
      HostMessenger: '0x2b212737722a674e3cdCc129B04689a1a5fe99a8',
      HostMessageQueue: '0x728C30d80e0a5d7C5369A20AdCD3DAB813085599',
      HostValidium: '0x230451558C226FC8a179F99F8D04C702dcf0341D',
      HostWeth: '0x5300000000000000000000000000000000000004',
      HostFastWithdrawVault: '0x5e30821a32F65bbf474B280806d23674dB565939',
      ValidiumERC20Gateway: '0x2C7fdc2b353DF97b9DC10c987e242DfA7f949F1D',
      ValidiumWeth: '0x0ca3a5aa3b8D039fd84Ed86912C9899AC01460fD',
    },
    testToken: 'cf7c9506ab57b2cb2fc077c1abed918be5aaf846b2fb820e2d9ce55a6d2b49a5',
  },

  'mainnet-test-001': {
    l2Endpoint: 'https://rpc.scroll.io',
    l3Endpoint: 'https://cloak-devnet-mainnet-test-001.scroll.systems',
    contracts: {
      HostWethGateway: '0x8FF6dA22ea83b0F421050Efd9DC40D4869D860Cc',
      HostERC20Gateway: '0xeB801b1732C59229c785c1034A5A1FE272d52F80',
      HostMessenger: '0x1F71c4A5D23BD1aFE4d961081131573874b97Abc',
      HostMessageQueue: '0xe0A47388a1CAaD010b8AA2180Cd9e2aE8eB8E66F',
      HostValidium: '0x4687FB513b0921b4fc95d21610678DFf4d220031',
      HostWeth: '0x5300000000000000000000000000000000000004',
      HostFastWithdrawVault: '0xe75DF043bc0B38307127e0b5d429C6380111cb78',
      ValidiumERC20Gateway: '0xC810961b5294a82Df639B014bC528EB5314f3206',
      ValidiumWeth: '0xEA4031D8C80d356e07C738a847d865c4893fE52a',
    },
    testToken: 'a63ca90220905945f6af9f7010284d331bcf339740d4dc83806de67fef3393c9',
  },

  'cloak-xen/sepolia': {
    l2Endpoint: 'https://sepolia-rpc.scroll.io',
    l3Endpoint: 'https://cloak-xen-sepolia-rpc.scroll.io',
    contracts: {
      HostWethGateway: '0x398Af66c464f93F97423f485f14934e1B01d92d6',
      HostERC20Gateway: '0x25A5F0f1bf1FCA96c2CD55e5c0855f3B92A8B1C7',
      HostMessenger: '0x17C095E86E4dabd19B645ceF0f04Ca583C178219',
      HostMessageQueue: '0xb5D7c8Ec8C7A72a0ed9782cB67Cc68b3915389a1',
      HostValidium: '0x283Eff377d7f38955c2aD1414DAE94e9A9b3270F',
      HostWeth: '0x5300000000000000000000000000000000000004',
      HostFastWithdrawVault: '0x53Ba2292Cdce8b5f4BFB7415614898c5Eed6b299',
      ValidiumERC20Gateway: '0xc2dAc4851a2c29105B923286291FFA64520A234f',
      ValidiumWeth: '0x389cAe009B61d3a94cefF927DfFDd812Bb61cCDA',
    },
    testToken: null,
  },

  'cloak-xen/mainnet': {
    l2Endpoint: 'https://mainnet-rpc.scroll.io',
    l3Endpoint: 'https://cloak-xen-mainnet-rpc.scroll.io',
    contracts: {
      HostWethGateway: '0xD46Ccf88eB54505709440927E9b9B836A1b679bB',
      HostERC20Gateway: '0x1efF9B6FD12E373e21749534172Cd35c2a2719C2',
      HostMessenger: '0xecE9cfDCe7e923FD595D71fa2aA62E1502047F13',
      HostMessageQueue: '0x845f52de4d0a7E0CD36993cC1867d29cE068de77',
      HostValidium: '0xb67fcb0C2A14DF77B3DFA773750F580B43776b31',
      HostWeth: '0x5300000000000000000000000000000000000004',
      HostFastWithdrawVault: '0x4102Ce64871A38F697568b9DeE37Da4355374156',
      ValidiumERC20Gateway: '0xbDA7426b43B2d7FC2E979f6f76030E9683f66d81',
      ValidiumWeth: '0x3dfe7CCDF68fa2a1186B656e61B5d725d8C3794c',
    },
    testToken: null,
  },

  'cloak-etherfi/sepolia': {
    l2Endpoint: 'https://sepolia-rpc.scroll.io',
    l3Endpoint: 'https://cloak-etherfi-sepolia-rpc.scroll.io',
    contracts: {
      HostWethGateway: '0x17E1a8f4c721CAD477F30aCe24FF14Ba66c9594e',
      HostERC20Gateway: '0x7886C897A9C87108d68c18276a2000c746a72Ad4',
      HostMessenger: '0x1855e414FC391663edEc3fC308e246A1c96Cef1F',
      HostMessageQueue: '0xD691c3E23D0e9B36838F0008a14861E9b16639Da',
      HostValidium: '0x81235f3d814a523f5FcD17c3c0d89B05809FC61F',
      HostWeth: '0x5300000000000000000000000000000000000004',
      HostFastWithdrawVault: '0x29c078983d21B8Bfb2f9Bc227Ce24E472CDe6012',
      ValidiumERC20Gateway: '0x45208569c2B93a85AC3CA3e73c7e7a91C8c08C36',
      ValidiumWeth: '0xB1F0AEEB2B723CcDc0D1fc23B5dF7aD5296f125F',
    },
    testToken: null,
  },

  'cloak-shiga/sepolia': {
    l2Endpoint: 'https://sepolia-rpc.scroll.io',
    l3Endpoint: 'https://cloak-shiga-sepolia-rpc.scroll.io',
    contracts: {
      HostWethGateway: '0x4151cBb70823d5e72f7497E253664cF051F256A9',
      HostERC20Gateway: '0x5F9b56473991619f1e54A7A921A4aF2bcF5f40e3',
      HostMessenger: '0xe2CcD708CDc157fB0697783f6e8eA9DB8F18F524',
      HostMessageQueue: '0xC0257980fE663B6320cc12e5514848b8ea0Ef40d',
      HostValidium: '0x6Ac9B33D97D8C1025b3e86Eaa58D96e36375D02B',
      HostWeth: '0x5300000000000000000000000000000000000004',
      HostFastWithdrawVault: '0xC0f89d842F04deE6ecE798268f93BBe5C6FF50E1',
      ValidiumERC20Gateway: '0x0f5094019c62E3f37b3df9Aaa6150bBE8949786c',
      ValidiumWeth: '0xe8b229b3DA6C39b8C32e005B143B144EF46A269A',
    },
    testToken: null,
  },
};

export default chains;
