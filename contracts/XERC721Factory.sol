// SPDX-License-Identifier: GPL-3.0-only
pragma solidity >=0.8.4 <0.9.0;

import {XERC721} from "./XERC721.sol";
import {IXERC721Factory} from "./interfaces/IXERC721Factory.sol";
import {XERC721Lockbox} from "./XERC721Lockbox.sol";
import {CREATE3} from "./lib/CREATE3.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract XERC721Factory is IXERC721Factory {
    using EnumerableSet for EnumerableSet.AddressSet;

    /**
     * @notice Address of the xerc721 maps to the address of its lockbox if it has one
     */
    mapping(address => address) internal _lockboxRegistry;

    /**
     * @notice The set of registered lockboxes
     */
    EnumerableSet.AddressSet internal _lockboxRegistryArray;

    /**
     * @notice The set of registered XERC721 tokens
     */
    EnumerableSet.AddressSet internal _xerc721RegistryArray;

    /**
     * @notice Deploys an XERC721 contract using CREATE3
     * @dev _limits and _minters must be the same length
     * @param _name The name of the token
     * @param _symbol The symbol of the token
     * @param _minterLimits The array of limits that you are adding (optional, can be an empty array)
     * @param _burnerLimits The array of limits that you are adding (optional, can be an empty array)
     * @param _bridges The array of bridges that you are adding (optional, can be an empty array)
     */

    function deployXERC721(
        string memory _name,
        string memory _symbol,
        uint64[] memory _minterLimits,
        uint64[] memory _burnerLimits,
        address[] memory _bridges
    ) external returns (address _xerc721) {
        _xerc721 = _deployXERC721(
            _name,
            _symbol,
            _minterLimits,
            _burnerLimits,
            _bridges
        );

        emit XERC721Deployed(_xerc721);
    }

    /**
     * @notice Deploys an XERC721Lockbox contract using CREATE3
     *
     * @dev When deploying a lockbox for the gas token of the chain, then, the base token needs to be address(0)
     * @param _xerc721 The address of the xerc721 that you want to deploy a lockbox for
     * @param _baseToken The address of the base token that you want to lock
     */

    function deployXERC721Lockbox(
        address _xerc721,
        address _baseToken
    ) external returns (address payable _lockbox) {
        if (_baseToken == address(0)) {
            revert IXERC721Factory_BadTokenAddress();
        }

        if (XERC721(_xerc721).owner() != msg.sender)
            revert IXERC721Factory_NotOwner();
        if (_lockboxRegistry[_xerc721] != address(0))
            revert IXERC721Factory_LockboxAlreadyDeployed();

        _lockbox = _deployLockbox(_xerc721, _baseToken);

        emit XERC721LockboxDeployed(_lockbox);
    }

    /**
     * @notice Deploys an XERC721 contract using CREATE3
     * @dev _limits and _minters must be the same length
     * @param _name The name of the token
     * @param _symbol The symbol of the token
     * @param _minterLimits The array of limits that you are adding (optional, can be an empty array)
     * @param _burnerLimits The array of limits that you are adding (optional, can be an empty array)
     * @param _bridges The array of burners that you are adding (optional, can be an empty array)
     */

    function _deployXERC721(
        string memory _name,
        string memory _symbol,
        uint64[] memory _minterLimits,
        uint64[] memory _burnerLimits,
        address[] memory _bridges
    ) internal returns (address _xerc721) {
        uint256 _bridgesLength = _bridges.length;
        if (
            _minterLimits.length != _bridgesLength ||
            _burnerLimits.length != _bridgesLength
        ) {
            revert IXERC721Factory_InvalidLength();
        }
        bytes32 _salt = keccak256(abi.encodePacked(_name, _symbol, msg.sender));
        bytes memory _creation = type(XERC721).creationCode;
        bytes memory _bytecode = abi.encodePacked(
            _creation,
            abi.encode(_name, _symbol, address(this))
        );

        _xerc721 = CREATE3.deploy(_salt, _bytecode, 0);

        EnumerableSet.add(_xerc721RegistryArray, _xerc721);

        for (uint256 _i; _i < _bridgesLength; ++_i) {
            XERC721(_xerc721).setLimits(
                _bridges[_i],
                _minterLimits[_i],
                _burnerLimits[_i]
            );
        }

        XERC721(_xerc721).transferOwnership(msg.sender);
    }

    function _deployLockbox(
        address _xerc721,
        address _baseToken
    ) internal returns (address payable _lockbox) {
        bytes32 _salt = keccak256(
            abi.encodePacked(_xerc721, _baseToken, msg.sender)
        );
        bytes memory _creation = type(XERC721Lockbox).creationCode;
        bytes memory _bytecode = abi.encodePacked(
            _creation,
            abi.encode(_xerc721, _baseToken, msg.sender)
        );

        _lockbox = payable(CREATE3.deploy(_salt, _bytecode, 0));

        XERC721(_xerc721).setLockbox(address(_lockbox));
        EnumerableSet.add(_lockboxRegistryArray, _lockbox);
        _lockboxRegistry[_xerc721] = _lockbox;
    }
}
