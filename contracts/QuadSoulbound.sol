//SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.16;

import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";

import "./interfaces/IQuadSoulbound.sol";

/// @title Quadrata Soulbound NFT
/// @author Fabrice Cheng, Theodore Clapp
/// @notice This represents Quadrata Soulbound NFT
contract QuadSoulbound is IQuadSoulbound, ContextUpgradeable {

    // Mapping from token ID to account balances
    mapping(uint256 => mapping(address => uint256)) private _balances;

    // Mapping from tokenId to uris
    mapping(uint256 => string) private _uris;

    uint256 private _idCounter;

    function uri(uint256 _tokenId) public view virtual override returns (string memory) {
        return _uris[_tokenId];
    }

    /**
     * @dev ERC1155 balanceOf implementation
     *
     * Requirements:
     *
     * - `account` cannot be the zero address.
     */
    function balanceOf(address account, uint256 id) public view virtual override returns (uint256) {
        require(account != address(0), "ERC1155: address zero is not a valid owner");
        return _balances[id][account];
    }

    /**
     * @dev Sets a new URI for all token types, by relying on the token type ID
     * substitution mechanism
     * https://eips.ethereum.org/EIPS/eip-1155#metadata[defined in the EIP].
     *
     * By this mechanism, any occurrence of the `\{id\}` substring in either the
     * URI or any of the amounts in the JSON file at said URI will be replaced by
     * clients with the token type ID.
     *
     * For example, the `https://token-cdn-domain/\{id\}.json` URI would be
     * interpreted by clients as
     * `https://token-cdn-domain/000000000000000000000000000000000000000000000000000000000004cce0.json`
     * for token type ID 0x4cce0.
     *
     * See {uri}.
     *
     * Because these URIs cannot be meaningfully represented by the {URI} event,
     * this function emits no events.
     */
    function _setURI(string memory newuri, uint256 tokenId) internal virtual {
        _uris[tokenId] = newuri;

        emit URI(newuri, tokenId);
    }

    /**
     * @dev Creates `amount` tokens of token type `id`, and assigns them to `to`.
     *
     * Emits a {TransferSingle} event.
     *
     * Requirements:
     *
     * - `to` cannot be the zero address.
     * - If `to` refers to a smart contract, it must implement {IERC1155Receiver-onERC1155Received} and return the
     * acceptance magic value.
     */
    function _mint(
        address to,
        uint256 id,
        uint256 amount
    ) internal virtual {
        require(to != address(0), "ERC1155: mint to the zero address");

        _balances[id][to] += amount;
        emit TransferSingle(_msgSender(), address(0), to, id, amount);
    }

    /**
     * @dev Destroys `amount` tokens of token type `id` from `from`
     *
     * Emits a {TransferSingle} event.
     *
     * Requirements:
     *
     * - `from` cannot be the zero address.
     * - `from` must have at least `amount` tokens of token type `id`.
     */
    function _burn(
        address from,
        uint256 id,
        uint256 amount
    ) internal virtual {
        require(from != address(0), "ERC1155: burn from the zero address");

        uint256 fromBalance = _balances[id][from];
        require(fromBalance >= amount, "ERC1155: burn amount exceeds balance");
        unchecked {
            _balances[id][from] = fromBalance - amount;
        }

        emit TransferSingle(_msgSender(), from, address(0), id, amount);
    }
}

