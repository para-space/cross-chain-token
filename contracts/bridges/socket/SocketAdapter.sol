// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import "./interfaces/IPlug.sol";
import "./interfaces/ISocket.sol";
import "../../interfaces/IXERC20.sol";

contract SocketAdapter is Ownable {
    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.UintSet;
    using SafeCast for uint256;

    ISocket public immutable socket;

    EnumerableSet.UintSet private whitelistedRemoteChainSlug;
    //local chain xtoken => remote chain slug => remote chain xtoken
    mapping(address => mapping(uint256 => address)) public xTokenBindingMap;
    mapping(uint256 => uint256) public minMsgGasLimit;

    error NotSocket();
    error InvalidRemoteChainSlug();
    error RemoteChainSlugAdded();
    error InvalidXToken();

    struct BridgeTokenInfo {
        address token;
        address user;
        uint256 amount;
    }

    constructor(address socket_) {
        socket = ISocket(socket_);
    }

    function bridgeToken(
        address token,
        uint256 amount,
        uint256 remoteChainSlug
    ) external payable {
        if (!whitelistedRemoteChainSlug.contains(remoteChainSlug))
            revert InvalidRemoteChainSlug();
        address remoteXToken = xTokenBindingMap[token][remoteChainSlug];
        if (remoteXToken == address(0)) revert InvalidXToken();

        IXERC20(token).burn(msg.sender, amount);

        BridgeTokenInfo memory info = BridgeTokenInfo({
            token: remoteXToken,
            user: msg.sender,
            amount: amount
        });
        bytes memory payload_ = abi.encode(info);

        ISocket(socket).outbound{value: msg.value}(
            remoteChainSlug.toUint32(),
            minMsgGasLimit[remoteChainSlug],
            "",
            "",
            payload_
        );
    }

    function getMinFees(
        uint256 remoteChainSlug
    ) external view returns (uint256 totalFees) {
        if (minMsgGasLimit[remoteChainSlug] == 0)
            revert InvalidRemoteChainSlug();

        BridgeTokenInfo memory info;
        bytes memory payload_ = abi.encode(info);

        totalFees = ISocket(socket).getMinFees(
            minMsgGasLimit[remoteChainSlug],
            payload_.length,
            "",
            "",
            remoteChainSlug.toUint32(),
            address(this)
        );
    }

    function inbound(
        uint32 srcChainSlug_,
        bytes calldata payload_
    ) external payable {
        if (msg.sender != address(socket)) revert NotSocket();
        BridgeTokenInfo memory info = abi.decode(payload_, (BridgeTokenInfo));
        if (!whitelistedRemoteChainSlug.contains(srcChainSlug_))
            revert InvalidRemoteChainSlug();

        IXERC20(info.token).mint(info.user, info.amount);
    }

    function updateMsgGasLimit(
        uint32 remoteChainSlug_,
        uint256 minMsgGasLimit_
    ) external onlyOwner {
        minMsgGasLimit[remoteChainSlug_] = minMsgGasLimit_;
    }

    function setSocketConfig(
        uint32 remoteChainSlug_,
        address remoteAdapter_,
        address switchboard_,
        uint256 minMsgGasLimit_
    ) external onlyOwner {
        if (whitelistedRemoteChainSlug.contains(remoteChainSlug_))
            revert RemoteChainSlugAdded();

        whitelistedRemoteChainSlug.add(remoteChainSlug_);
        minMsgGasLimit[remoteChainSlug_] = minMsgGasLimit_;
        ISocket(socket).connect(
            remoteChainSlug_,
            remoteAdapter_,
            switchboard_,
            switchboard_
        );
    }

    function configAssetMapping(
        address xToken,
        uint32 remoteChainSlug,
        address remoteXToken
    ) external onlyOwner {
        if (!whitelistedRemoteChainSlug.contains(remoteChainSlug))
            revert InvalidRemoteChainSlug();
        xTokenBindingMap[xToken][remoteChainSlug] = remoteXToken;
    }
}
