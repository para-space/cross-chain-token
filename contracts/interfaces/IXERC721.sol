// SPDX-License-Identifier: GPL-3.0-only
pragma solidity >=0.8.4 <0.9.0;

interface IXERC721 {
    /**
     * @notice Emits when a lockbox is set
     *
     * @param _lockbox The address of the lockbox
     */

    event LockboxSet(address _lockbox);

    /**
     * @notice Emits when a limit is set
     *
     * @param _mintingLimit The updated minting limit we are setting to the bridge
     * @param _burningLimit The updated burning limit we are setting to the bridge
     * @param _bridge The address of the bridge we are setting the limit too
     */
    event BridgeLimitsSet(
        uint64 _mintingLimit,
        uint64 _burningLimit,
        address indexed _bridge
    );

    /**
     * @notice Reverts when a user with too low of a limit tries to call mint/burn
     */

    error IXERC721_NotHighEnoughLimits();

    error IXERC721_NotTokenOwnerOrApproved();

    error IXERC721_NotTokenOwner();

    /**
     * @notice Reverts when caller is not the factory
     */

    error IXERC20_NotFactory();

    struct Bridge {
        BridgeParameters minterParams;
        BridgeParameters burnerParams;
    }

    struct BridgeParameters {
        uint64 timestamp;
        uint64 ratePerHour;
        uint64 maxLimit;
        uint64 currentLimit;
    }

    /**
     * @notice Sets the lockbox address
     *
     * @param _lockbox The address of the lockbox
     */

    function setLockbox(address _lockbox) external;

    /**
     * @notice Updates the limits of any bridge
     * @dev Can only be called by the owner
     * @param _mintingLimit The updated minting limit we are setting to the bridge
     * @param _burningLimit The updated burning limit we are setting to the bridge
     * @param _bridge The address of the bridge we are setting the limits too
     */
    function setLimits(
        address _bridge,
        uint64 _mintingLimit,
        uint64 _burningLimit
    ) external;

    /**
     * @notice Returns the max limit of a minter
     *
     * @param _minter The minter we are viewing the limits of
     *  @return _limit The limit the minter has
     */
    function mintingMaxLimitOf(
        address _minter
    ) external view returns (uint64 _limit);

    /**
     * @notice Returns the max limit of a bridge
     *
     * @param _bridge the bridge we are viewing the limits of
     * @return _limit The limit the bridge has
     */

    function burningMaxLimitOf(
        address _bridge
    ) external view returns (uint64 _limit);

    /**
     * @notice Returns the current limit of a minter
     *
     * @param _minter The minter we are viewing the limits of
     * @return _limit The limit the minter has
     */

    function mintingCurrentLimitOf(
        address _minter
    ) external view returns (uint64 _limit);

    /**
     * @notice Returns the current limit of a bridge
     *
     * @param _bridge the bridge we are viewing the limits of
     * @return _limit The limit the bridge has
     */

    function burningCurrentLimitOf(
        address _bridge
    ) external view returns (uint64 _limit);

    /**
     * @notice Mints tokens for a user
     * @dev Can only be called by a minter
     * @param _user The address of the user who needs tokens minted
     * @param _tokenIds The tokenId of NFT being minted
     */

    function mint(address _user, uint256[] calldata _tokenIds) external;

    /**
     * @notice Burns tokens for a user
     * @dev Can only be called by a minter
     * @param _user The address of the user who needs tokens burned
     * @param _tokenIds The tokenIds of NFT being burned
     */

    function burn(address _user, uint256[] calldata _tokenIds) external;
}
