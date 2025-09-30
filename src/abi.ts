import { parseAbi } from 'viem';

export const HostWethGatewayAbi = parseAbi([
  'function deposit(bytes memory _to, uint256 _amount, uint256 _keyId) payable',
]);

export const HostERC20GatewayAbi = parseAbi([
  'function getL2ERC20Address(address _l1Token) view returns (address)',
  'function depositERC20(address _token, bytes memory _to, uint256 _amount, uint256 _gasLimit, uint256 _keyId) payable',
]);

export const HostMessageQueueAbi = parseAbi([
  'event QueueTransaction(address indexed sender, address indexed target, uint256 value, uint64 queueIndex, uint256 gasLimit, bytes data)',
]);

export const HostMessengerAbi = parseAbi([
  'event RelayedMessage(bytes32 indexed messageHash)',
  'event FailedRelayedMessage(bytes32 indexed messageHash)',
  'struct L2MessageProof { uint256 batchIndex; bytes merkleProof; }',
  'function relayMessageWithProof(address _from, address _to, uint256 _value, uint256 _nonce, bytes memory _message, L2MessageProof memory _proof)',
]);

export const HostValidiumAbi = parseAbi([
  'function getLatestEncryptionKey() view returns (uint256, bytes memory)',
]);

export const ValidiumMessengerAbi = parseAbi([
  'function relayMessage(address _sender, address _target, uint256 _value, uint256 _messageNonce, bytes _message)',
]);

export const ValidiumERC20GatewayAbi = parseAbi([
  'function finalizeDepositERC20(address _l1Token, address _l2Token, address _from, address _to, uint256 _amount, bytes _data)',
  'function finalizeDepositERC20Encrypted(address _l1Token, address _l2Token, address _from, bytes _to, uint256 _amount, bytes _data)',
  'function withdrawERC20(address _token, address _to, uint256 _amount, uint256 _gasLimit)',
  'function withdrawERC20AndCall(address _token, address _to, uint256 _amount, bytes calldata _data, uint256 _gasLimit)',
]);

export const ERC20Abi = parseAbi([
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function name() view returns (string memory)',
  'function symbol() view returns (string memory)',
  'function totalSupply() view returns (uint256)',
  'function transfer(address to, uint256 amount)',
  'function transferFrom(address from,address to, uint256 amount)',
]);

export const WrappedETHAbi = parseAbi(['function withdraw(uint256 wad)']);

const abis = {
  HostWethGateway: HostWethGatewayAbi,
  HostERC20Gateway: HostERC20GatewayAbi,
  HostMessageQueue: HostMessageQueueAbi,
  HostMessenger: HostMessengerAbi,
  HostValidium: HostValidiumAbi,
  ValidiumMessenger: ValidiumMessengerAbi,
  ValidiumERC20Gateway: ValidiumERC20GatewayAbi,
  ERC20: ERC20Abi,
  WrappedETH: WrappedETHAbi,
};

export default abis;
