// SPDX-License-Identifier: GPL-3.0-only
pragma solidity 0.8.20;

interface IERC721Strategy {
    function withdraw(uint256[] calldata tokenIds) external;

    function yield(uint256[] calldata tokenIds) external;
}
