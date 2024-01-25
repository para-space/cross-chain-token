// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "../interfaces/IERC721Strategy.sol";
import "../interfaces/IXERC721Lockbox.sol";

contract ApeStakingStrategy is IERC721Strategy, Initializable, IERC721Receiver {
    address public immutable baycVault;
    address public immutable maycVault;
    address public immutable bakcVault;

    error InvalidCaller();

    constructor(address _baycVault, address _maycVault, address _bakcVault) {
        baycVault = _baycVault;
        maycVault = _maycVault;
        bakcVault = _bakcVault;
    }

    function initialize() public initializer {}

    function yield(uint256[] calldata tokenIds) external {
        if (
            msg.sender != baycVault &&
            msg.sender != maycVault &&
            msg.sender != bakcVault
        ) {
            revert InvalidCaller();
        }

        IERC721 token = IXERC721Lockbox(msg.sender).ERC721();
        for (uint256 index = 0; index < tokenIds.length; index++) {
            token.safeTransferFrom(msg.sender, address(this), tokenIds[index]);
        }
    }

    function withdraw(uint256[] calldata tokenIds) external {
        if (
            msg.sender != baycVault &&
            msg.sender != maycVault &&
            msg.sender != bakcVault
        ) {
            revert InvalidCaller();
        }

        IERC721 token = IXERC721Lockbox(msg.sender).ERC721();
        for (uint256 index = 0; index < tokenIds.length; index++) {
            token.safeTransferFrom(address(this), msg.sender, tokenIds[index]);
        }
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes memory
    ) external pure returns (bytes4) {
        return this.onERC721Received.selector;
    }
}
