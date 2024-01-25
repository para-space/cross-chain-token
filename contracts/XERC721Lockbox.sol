// SPDX-License-Identifier: GPL-3.0-only
pragma solidity >=0.8.4 <0.9.0;

import {IXERC721} from "./interfaces/IXERC721.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import {IXERC721Lockbox} from "./interfaces/IXERC721Lockbox.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC721Strategy} from "./interfaces/IERC721Strategy.sol";

contract XERC721Lockbox is Ownable, IXERC721Lockbox, IERC721Receiver {
    /**
     * @notice The XERC721 token of this contract
     */
    IXERC721 public immutable XERC721;

    /**
     * @notice The ERC721 token of this contract
     */
    IERC721 public immutable ERC721;

    /**
     * @notice Address of the strategy contract
     */
    address public strategy;

    /**
     * @notice Constructor
     *
     * @param _xerc721 The address of the XERC721 contract
     * @param _erc721 The address of the ERC721 contract
     */

    constructor(address _xerc721, address _erc721, address initialOwner) {
        _transferOwnership(initialOwner);
        XERC721 = IXERC721(_xerc721);
        ERC721 = IERC721(_erc721);
    }

    /**
     * @notice Deposit ERC721 tokens into the lockbox
     *
     * @param _tokenIds The tokenIds of ERC721 to deposit
     */

    function deposit(uint256[] calldata _tokenIds) external {
        _deposit(msg.sender, _tokenIds);
    }

    /**
     * @notice Deposit ERC721 tokens into the lockbox, and send the XERC721 to a user
     *
     * @param _to The user to send the XERC721 to
     * @param _tokenIds The tokenIds of ERC721 to deposit
     */

    function depositTo(address _to, uint256[] calldata _tokenIds) external {
        _deposit(_to, _tokenIds);
    }

    /**
     * @notice Withdraw ERC20 tokens from the lockbox
     *
     * @param _tokenIds The tokenIds of ERC721 to withdraw
     */

    function withdraw(uint256[] calldata _tokenIds) external {
        _withdraw(msg.sender, _tokenIds);
    }

    /**
     * @notice Withdraw tokens from the lockbox
     *
     * @param _to The user to withdraw to
     * @param _tokenIds The tokenIds of ERC721 to withdraw
     */

    function withdrawTo(address _to, uint256[] calldata _tokenIds) external {
        _withdraw(_to, _tokenIds);
    }

    /**
     * @notice Withdraw tokens from the lockbox
     *
     * @param _to The user to withdraw to
     * @param _tokenIds The tokenIds of ERC721 to withdraw
     */

    function _withdraw(address _to, uint256[] calldata _tokenIds) internal {
        uint256 amount = _tokenIds.length;
        for (uint256 index = 0; index < amount; index++) {
            uint256 tokenId = _tokenIds[index];
            ERC721.safeTransferFrom(address(this), _to, tokenId);
            emit Withdraw(_to, tokenId);
        }

        XERC721.burn(msg.sender, _tokenIds);
    }

    /**
     * @notice Deposit tokens into the lockbox
     *
     * @param _to The address to send the XERC721 to
     * @param _tokenIds The tokenId of ERC721 to deposit
     */

    function _deposit(address _to, uint256[] calldata _tokenIds) internal {
        uint256 amount = _tokenIds.length;
        for (uint256 index = 0; index < amount; index++) {
            uint256 tokenId = _tokenIds[index];
            ERC721.safeTransferFrom(msg.sender, address(this), tokenId);
            emit Deposit(_to, tokenId);
        }

        XERC721.mint(_to, _tokenIds);
    }

    /**
     * @notice Update strategy address, only owner can call this function
     *
     * @param strategy_ New strategy contract address
     */
    function setStrategy(address strategy_) external onlyOwner {
        strategy = strategy_;
    }

    /**
     * @notice yield interest by strategy contract, only owner can call this function
     *
     * @param tokenIds The token id of the ERC721 to yield
     */
    function strategyYield(uint256[] calldata tokenIds) external onlyOwner {
        if (strategy == address(0)) {
            revert IXERC721Lockbox_StrategyNotSet();
        }
        ERC721.setApprovalForAll(strategy, true);
        IERC721Strategy(strategy).yield(tokenIds);
        ERC721.setApprovalForAll(strategy, false);
    }

    /**
     * @notice withdraw asset from yield contract, only owner can call this function
     *
     * @param tokenIds The tokenIds of the ERC721 to withdraw from yield strategy
     */
    function strategyWithdraw(uint256[] calldata tokenIds) external onlyOwner {
        IERC721Strategy(strategy).withdraw(tokenIds);
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes memory
    ) external pure returns (bytes4) {
        return this.onERC721Received.selector;
    }

    /**
     * @notice Rescue ERC721 from this contract address. only owner can call this function
     * @param token The address of the token
     * @param to The account address to receive token
     * @param tokenIds The tokenIds of ERC721 to be rescued
     **/
    function rescueERC721(
        address token,
        address to,
        uint256[] calldata tokenIds
    ) external onlyOwner {
        uint256 amount = tokenIds.length;
        for (uint256 index = 0; index < amount; index++) {
            uint256 tokenId = tokenIds[index];
            IERC721(token).safeTransferFrom(address(this), to, tokenId);
            emit RescueERC721(token, to, tokenId);
        }
    }
}
