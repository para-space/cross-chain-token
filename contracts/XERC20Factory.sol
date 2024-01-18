// SPDX-License-Identifier: GPL-3.0-only
pragma solidity >=0.8.4 <0.9.0;

import {XERC20} from "./XERC20.sol";
import {IXERC20Factory} from "./interfaces/IXERC20Factory.sol";
import {XERC20Lockbox} from "./XERC20Lockbox.sol";
import {CREATE3} from "./lib/CREATE3.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract XERC20Factory is IXERC20Factory {
    using EnumerableSet for EnumerableSet.AddressSet;

    /**
     * @notice Address of the xerc20 maps to the address of its lockbox if it has one
     */
    mapping(address => address) public lockboxRegistry;

    /**
     * @notice The set of registered lockboxes
     */
    EnumerableSet.AddressSet internal _lockboxRegistryArray;

    /**
     * @notice The set of registered XERC20 tokens
     */
    EnumerableSet.AddressSet internal _xerc20RegistryArray;

    /**
     * @notice Deploys XERC20 & XERC20Lockbox contract for a token
     * @dev _limits and _minters must be the same length
     * @param _name The name of the token
     * @param _symbol The symbol of the token
     * @param _minterLimits The array of limits that you are adding (optional, can be an empty array)
     * @param _burnerLimits The array of limits that you are adding (optional, can be an empty array)
     * @param _bridges The array of bridges that you are adding (optional, can be an empty array)
     */
    function deployToken(
        address _baseToken,
        bool _isGasToken,
        string memory _name,
        string memory _symbol,
        uint256[] memory _minterLimits,
        uint256[] memory _burnerLimits,
        address[] memory _bridges
    ) external {
        address xERC20 = deployXERC20(
            _name,
            _symbol,
            _minterLimits,
            _burnerLimits,
            _bridges
        );
        deployLockbox(xERC20, _baseToken, _isGasToken);
    }

    /**
     * @notice Deploys an XERC20 contract using CREATE3
     * @dev _limits and _minters must be the same length
     * @param _name The name of the token
     * @param _symbol The symbol of the token
     * @param _minterLimits The array of limits that you are adding (optional, can be an empty array)
     * @param _burnerLimits The array of limits that you are adding (optional, can be an empty array)
     * @param _bridges The array of bridges that you are adding (optional, can be an empty array)
     */

    function deployXERC20(
        string memory _name,
        string memory _symbol,
        uint256[] memory _minterLimits,
        uint256[] memory _burnerLimits,
        address[] memory _bridges
    ) public returns (address _xerc20) {
        _xerc20 = _deployXERC20(
            _name,
            _symbol,
            _minterLimits,
            _burnerLimits,
            _bridges
        );

        emit XERC20Deployed(_xerc20);
    }

    /**
     * @notice Deploys an XERC20Lockbox contract using CREATE3
     *
     * @dev When deploying a lockbox for the gas token of the chain, then, the base token needs to be address(0)
     * @param _xerc20 The address of the xerc20 that you want to deploy a lockbox for
     * @param _baseToken The address of the base token that you want to lock
     * @param _isGasToken Whether or not the base token is the native (gas) token of the chain. Eg: MATIC for polygon chain
     */

    function deployLockbox(
        address _xerc20,
        address _baseToken,
        bool _isGasToken
    ) public returns (address payable _lockbox) {
        if (
            (_baseToken == address(0) && !_isGasToken) ||
            (_isGasToken && _baseToken != address(0))
        ) {
            revert IXERC20Factory_BadTokenAddress();
        }

        if (XERC20(_xerc20).owner() != msg.sender)
            revert IXERC20Factory_NotOwner();
        if (lockboxRegistry[_baseToken] != address(0))
            revert IXERC20Factory_LockboxAlreadyDeployed();

        _lockbox = _deployLockbox(_xerc20, _baseToken, _isGasToken);

        emit LockboxDeployed(_lockbox);
    }

    /**
     * @notice Deploys an XERC20 contract using CREATE3
     * @dev _limits and _minters must be the same length
     * @param _name The name of the token
     * @param _symbol The symbol of the token
     * @param _minterLimits The array of limits that you are adding (optional, can be an empty array)
     * @param _burnerLimits The array of limits that you are adding (optional, can be an empty array)
     * @param _bridges The array of burners that you are adding (optional, can be an empty array)
     */

    function _deployXERC20(
        string memory _name,
        string memory _symbol,
        uint256[] memory _minterLimits,
        uint256[] memory _burnerLimits,
        address[] memory _bridges
    ) internal returns (address _xerc20) {
        uint256 _bridgesLength = _bridges.length;
        if (
            _minterLimits.length != _bridgesLength ||
            _burnerLimits.length != _bridgesLength
        ) {
            revert IXERC20Factory_InvalidLength();
        }
        bytes32 _salt = keccak256(abi.encodePacked(_name, _symbol, msg.sender));
        bytes memory _creation = type(XERC20).creationCode;
        bytes memory _bytecode = abi.encodePacked(
            _creation,
            abi.encode(_name, _symbol, address(this))
        );

        _xerc20 = CREATE3.deploy(_salt, _bytecode, 0);

        EnumerableSet.add(_xerc20RegistryArray, _xerc20);

        for (uint256 _i; _i < _bridgesLength; ++_i) {
            XERC20(_xerc20).setLimits(
                _bridges[_i],
                _minterLimits[_i],
                _burnerLimits[_i]
            );
        }

        XERC20(_xerc20).transferOwnership(msg.sender);
    }

    function _deployLockbox(
        address _xerc20,
        address _baseToken,
        bool _isGasToken
    ) internal returns (address payable _lockbox) {
        bytes32 _salt = keccak256(
            abi.encodePacked(_xerc20, _baseToken, msg.sender)
        );
        bytes memory _creation = type(XERC20Lockbox).creationCode;
        bytes memory _bytecode = abi.encodePacked(
            _creation,
            abi.encode(_xerc20, _baseToken, _isGasToken, msg.sender)
        );

        _lockbox = payable(CREATE3.deploy(_salt, _bytecode, 0));

        XERC20(_xerc20).setLockbox(address(_lockbox));
        EnumerableSet.add(_lockboxRegistryArray, _lockbox);
        lockboxRegistry[_baseToken] = _lockbox;
    }
}
