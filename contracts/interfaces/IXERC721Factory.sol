// SPDX-License-Identifier: GPL-3.0-only
pragma solidity >=0.8.4 <0.9.0;

interface IXERC721Factory {
    /**
     * @notice Emitted when a new XERC721 is deployed
     */

    event XERC721Deployed(address _xerc721);

    /**
     * @notice Emitted when a new XERC721Lockbox is deployed
     */

    event XERC721LockboxDeployed(address _lockbox);

    /**
     * @notice Reverts when a non-owner attempts to call
     */

    error IXERC721Factory_NotOwner();

    /**
     * @notice Reverts when a lockbox is trying to be deployed from a malicious address
     */

    error IXERC721Factory_BadTokenAddress();

    /**
     * @notice Reverts when a lockbox is already deployed
     */

    error IXERC721Factory_LockboxAlreadyDeployed();

    /**
     * @notice Reverts when a xERC721 is already deployed
     */

    error IXERC721Factory_XERC20AlreadyDeployed();

    /**
     * @notice Reverts when a the length of arrays sent is incorrect
     */
    error IXERC721Factory_InvalidLength();

    /**
     * @notice Deploys an XERC721 contract using CREATE3
     * @dev _limits and _minters must be the same length
     * @param _name The name of the token
     * @param _symbol The symbol of the token
     * @param _burnerLimits The array of limits that you are adding (optional, can be an empty array)
     * @param _bridges The array of burners that you are adding (optional, can be an empty array)
     */

    function deployXERC721(
        string memory _name,
        string memory _symbol,
        uint64[] memory _minterLimits,
        uint64[] memory _burnerLimits,
        address[] memory _bridges
    ) external returns (address _xerc721);

    /**
     * @notice Deploys an XERC721Lockbox contract using CREATE3
     *
     * @param _xerc721 The address of the xerc721 that you want to deploy a lockbox for
     * @param _baseToken The address of the base token that you want to lock
     */

    function deployXERC721Lockbox(
        address _xerc721,
        address _baseToken
    ) external returns (address payable _lockbox);
}
