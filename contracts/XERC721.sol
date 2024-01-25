// SPDX-License-Identifier: GPL-3.0-only
pragma solidity >=0.8.4 <0.9.0;

import {ERC721, ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {IXERC721} from "./interfaces/IXERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";

contract XERC721 is ERC721Enumerable, Ownable, IXERC721 {
    using SafeCast for uint256;
    /**
     * @notice The duration it takes for the limits to fully replenish
     */
    uint64 private constant _DURATION = 1 days;

    /**
     * @notice The seconds for a hour
     */
    uint64 private constant _SecsPerHour = 3600;

    /**
     * @notice The address of the factory which deployed this contract
     */
    address public immutable FACTORY;

    /**
     * @notice The address of the lockbox contract
     */
    address public lockbox;

    /**
     * @notice Maps bridge address to bridge configurations
     */
    mapping(address => Bridge) public bridges;

    /**
     * @notice Constructs the initial config of the XERC721
     *
     * @param _name The name of the token
     * @param _symbol The symbol of the token
     * @param _factory The factory which deployed this contract
     */

    constructor(
        string memory _name,
        string memory _symbol,
        address _factory
    ) ERC721(_name, _symbol) {
        _transferOwnership(_factory);
        FACTORY = _factory;
    }

    /**
     * @notice Mints a tokenId for a user
     * @dev Can only be called by a bridge
     * @param _user The address of the user who needs tokens minted
     * @param _tokenIds The tokenId of NFT being minted
     */

    function mint(address _user, uint256[] calldata _tokenIds) external {
        _mintWithCaller(msg.sender, _user, _tokenIds);
    }

    /**
     * @notice Burns a tokenId for a user
     * @dev Can only be called by a bridge
     * @param _user The address of the user who needs tokens burned
     * @param _tokenIds The tokenIds of NFT being burned
     */

    function burn(address _user, uint256[] calldata _tokenIds) external {
        if (msg.sender != _user) {
            if (!isApprovedForAll(_user, msg.sender)) {
                //check one by one
                uint256 amount = _tokenIds.length;
                for (uint256 index = 0; index < amount; index++) {
                    if (!_isApprovedOrOwner(msg.sender, _tokenIds[index])) {
                        revert IXERC721_NotTokenOwnerOrApproved();
                    }
                }
            }
        }

        _burnWithCaller(msg.sender, _user, _tokenIds);
    }

    /**
     * @notice Sets the lockbox address
     *
     * @param _lockbox The address of the lockbox
     */

    function setLockbox(address _lockbox) external {
        if (msg.sender != FACTORY) revert IXERC20_NotFactory();
        lockbox = _lockbox;

        emit LockboxSet(_lockbox);
    }

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
    ) external onlyOwner {
        _changeMinterLimit(_bridge, _mintingLimit);
        _changeBurnerLimit(_bridge, _burningLimit);
        emit BridgeLimitsSet(_mintingLimit, _burningLimit, _bridge);
    }

    /**
     * @notice Returns the max limit of a bridge
     *
     * @param _bridge the bridge we are viewing the limits of
     * @return _limit The limit the bridge has
     */

    function mintingMaxLimitOf(
        address _bridge
    ) public view returns (uint64 _limit) {
        _limit = bridges[_bridge].minterParams.maxLimit;
    }

    /**
     * @notice Returns the max limit of a bridge
     *
     * @param _bridge the bridge we are viewing the limits of
     * @return _limit The limit the bridge has
     */

    function burningMaxLimitOf(
        address _bridge
    ) public view returns (uint64 _limit) {
        _limit = bridges[_bridge].burnerParams.maxLimit;
    }

    /**
     * @notice Returns the current limit of a bridge
     *
     * @param _bridge the bridge we are viewing the limits of
     * @return _limit The limit the bridge has
     */

    function mintingCurrentLimitOf(
        address _bridge
    ) public view returns (uint64 _limit) {
        _limit = _getCurrentLimit(
            bridges[_bridge].minterParams.currentLimit,
            bridges[_bridge].minterParams.maxLimit,
            bridges[_bridge].minterParams.timestamp,
            bridges[_bridge].minterParams.ratePerHour
        );
    }

    /**
     * @notice Returns the current limit of a bridge
     *
     * @param _bridge the bridge we are viewing the limits of
     * @return _limit The limit the bridge has
     */

    function burningCurrentLimitOf(
        address _bridge
    ) public view returns (uint64 _limit) {
        _limit = _getCurrentLimit(
            bridges[_bridge].burnerParams.currentLimit,
            bridges[_bridge].burnerParams.maxLimit,
            bridges[_bridge].burnerParams.timestamp,
            bridges[_bridge].burnerParams.ratePerHour
        );
    }

    /**
     * @notice Uses the limit of any bridge
     * @param _bridge The address of the bridge who is being changed
     * @param _change The change in the limit
     */

    function _useMinterLimits(address _bridge, uint64 _change) internal {
        uint64 _currentLimit = mintingCurrentLimitOf(_bridge);
        bridges[_bridge].minterParams.timestamp = block.timestamp.toUint64();
        bridges[_bridge].minterParams.currentLimit = _currentLimit - _change;
    }

    /**
     * @notice Uses the limit of any bridge
     * @param _bridge The address of the bridge who is being changed
     * @param _change The change in the limit
     */

    function _useBurnerLimits(address _bridge, uint64 _change) internal {
        uint64 _currentLimit = burningCurrentLimitOf(_bridge);
        bridges[_bridge].burnerParams.timestamp = block.timestamp.toUint64();
        bridges[_bridge].burnerParams.currentLimit = _currentLimit - _change;
    }

    /**
     * @notice Updates the limit of any bridge
     * @dev Can only be called by the owner
     * @param _bridge The address of the bridge we are setting the limit too
     * @param _limit The updated limit we are setting to the bridge
     */

    function _changeMinterLimit(address _bridge, uint64 _limit) internal {
        uint64 _oldLimit = bridges[_bridge].minterParams.maxLimit;
        uint64 _currentLimit = mintingCurrentLimitOf(_bridge);
        bridges[_bridge].minterParams.maxLimit = _limit;

        bridges[_bridge].minterParams.currentLimit = _calculateNewCurrentLimit(
            _limit,
            _oldLimit,
            _currentLimit
        );

        bridges[_bridge].minterParams.ratePerHour =
            (_limit * _SecsPerHour) /
            _DURATION;
        bridges[_bridge].minterParams.timestamp = block.timestamp.toUint64();
    }

    /**
     * @notice Updates the limit of any bridge
     * @dev Can only be called by the owner
     * @param _bridge The address of the bridge we are setting the limit too
     * @param _limit The updated limit we are setting to the bridge
     */

    function _changeBurnerLimit(address _bridge, uint64 _limit) internal {
        uint64 _oldLimit = bridges[_bridge].burnerParams.maxLimit;
        uint64 _currentLimit = burningCurrentLimitOf(_bridge);
        bridges[_bridge].burnerParams.maxLimit = _limit;

        bridges[_bridge].burnerParams.currentLimit = _calculateNewCurrentLimit(
            _limit,
            _oldLimit,
            _currentLimit
        );

        bridges[_bridge].burnerParams.ratePerHour =
            (_limit * _SecsPerHour) /
            _DURATION;
        bridges[_bridge].burnerParams.timestamp = block.timestamp.toUint64();
    }

    /**
     * @notice Updates the current limit
     *
     * @param _limit The new limit
     * @param _oldLimit The old limit
     * @param _currentLimit The current limit
     */

    function _calculateNewCurrentLimit(
        uint64 _limit,
        uint64 _oldLimit,
        uint64 _currentLimit
    ) internal pure returns (uint64 _newCurrentLimit) {
        uint64 _difference;

        if (_oldLimit > _limit) {
            _difference = _oldLimit - _limit;
            _newCurrentLimit = _currentLimit > _difference
                ? _currentLimit - _difference
                : 0;
        } else {
            _difference = _limit - _oldLimit;
            _newCurrentLimit = _currentLimit + _difference;
        }
    }

    /**
     * @notice Gets the current limit
     *
     * @param _currentLimit The current limit
     * @param _maxLimit The max limit
     * @param _timestamp The timestamp of the last update
     * @param _ratePerHour The rate per second
     */

    function _getCurrentLimit(
        uint64 _currentLimit,
        uint64 _maxLimit,
        uint64 _timestamp,
        uint64 _ratePerHour
    ) internal view returns (uint64 _limit) {
        _limit = _currentLimit;
        if (_limit == _maxLimit) {
            return _limit;
        } else if (_timestamp + _DURATION <= block.timestamp) {
            _limit = _maxLimit;
        } else if (_timestamp + _DURATION > block.timestamp) {
            uint64 _timePassed = block.timestamp.toUint64() - _timestamp;
            uint64 _hourPassed = _timePassed / _SecsPerHour;
            uint64 _calculatedLimit = _limit + (_hourPassed * _ratePerHour);
            _limit = _calculatedLimit > _maxLimit
                ? _maxLimit
                : _calculatedLimit;
        }
    }

    /**
     * @notice Internal function for burning tokens
     *
     * @param _caller The caller address
     * @param _tokenIds The token ids to burn
     */

    function _burnWithCaller(
        address _caller,
        address _user,
        uint256[] memory _tokenIds
    ) internal {
        uint64 amount = _tokenIds.length.toUint64();
        if (_caller != lockbox) {
            uint64 _currentLimit = burningCurrentLimitOf(_caller);
            if (_currentLimit < amount) revert IXERC721_NotHighEnoughLimits();
            _useBurnerLimits(_caller, amount);
        }
        for (uint256 index = 0; index < amount; index++) {
            uint256 tokenId = _tokenIds[index];
            if (ownerOf(tokenId) != _user) {
                revert IXERC721_NotTokenOwner();
            }
            _burn(tokenId);
        }
    }

    /**
     * @notice Internal function for minting tokens
     *
     * @param _caller The caller address
     * @param _user The user address
     * @param _tokenIds The token ids to mint
     */

    function _mintWithCaller(
        address _caller,
        address _user,
        uint256[] memory _tokenIds
    ) internal {
        uint64 amount = _tokenIds.length.toUint64();
        if (_caller != lockbox) {
            uint64 _currentLimit = mintingCurrentLimitOf(_caller);
            if (_currentLimit < amount) revert IXERC721_NotHighEnoughLimits();
            _useMinterLimits(_caller, amount);
        }
        for (uint256 index = 0; index < amount; index++) {
            _mint(_user, _tokenIds[index]);
        }
    }
}
