// SPDX-License-Identifier: GPL-3.0-only
pragma solidity >=0.8.4 <0.9.0;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IXERC721} from "./IXERC721.sol";

interface IXERC721Lockbox {
    /**
     * @notice Emitted when tokens are deposited into the lockbox
     */

    event Deposit(address _sender, uint256 _tokenId);

    /**
     * @notice Emitted when tokens are withdrawn from the lockbox
     */

    event Withdraw(address _sender, uint256 _tokenId);

    /**
     * @notice Emitted during rescueERC721()
     * @param token The address of the token
     * @param to The account address to receive token
     * @param tokenId The tokenId of ERC721 to be rescued
     **/
    event RescueERC721(address token, address to, uint256 tokenId);

    /**
     * @notice Reverts when a user tries to withdraw and the call fails
     */

    error IXERC721Lockbox_WithdrawFailed();

    /**
     * @notice Reverts when tries to yield without yield strategy
     */
    error IXERC721Lockbox_StrategyNotSet();

    /**
     * @notice Deposit ERC721 tokens into the lockbox
     *
     * @param _tokenIds The tokenId of ERC721 to deposit
     */

    function deposit(uint256[] calldata _tokenIds) external;

    /**
     * @notice Deposit ERC721 tokens into the lockbox, and send the XERC721 to a user
     *
     * @param _user The user to send the XERC721 to
     * @param _tokenIds The tokenId of ERC721 to deposit
     */

    function depositTo(address _user, uint256[] calldata _tokenIds) external;

    /**
     * @notice Withdraw ERC721 tokens from the lockbox
     *
     * @param _tokenIds The tokenId of ERC721 to withdraw
     */

    function withdraw(uint256[] calldata _tokenIds) external;

    /**
     * @notice Withdraw ERC721 tokens from the lockbox
     *
     * @param _user The user to withdraw to
     * @param _tokenIds The tokenId of ERC721 to withdraw
     */

    function withdrawTo(address _user, uint256[] calldata _tokenIds) external;

    /**
     * @notice Get underlying ERC721 token address
     *
     */
    function ERC721() external view returns (IERC721);

    /**
     * @notice Get xERC721 token address
     *
     */
    function XERC721() external view returns (IXERC721);
}
