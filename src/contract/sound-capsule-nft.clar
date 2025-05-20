;; sound-capsule-nft.clar

;; NFT definition
(define-non-fungible-token sound-capsule uint)

;; Constants
(define-constant contract-owner tx-sender)

;; Data variables
(define-data-var last-token-id uint u0)

;; Map definitions
(define-map token-uri-map (tuple (id uint)) (tuple (uri (string-ascii 256))))
(define-map minter-whitelist (tuple (minter principal)) (tuple (is-allowed bool)))
(define-map nft-royalty-map (tuple (token-id uint)) (tuple (recipient principal) (bps uint)))

;; Error codes
(define-constant ERR-NOT-AUTHORIZED u101)
(define-constant ERR-NOT-FOUND u102)
(define-constant ERR-MAX-SUPPLY-REACHED u103)
(define-constant ERR-OWNER-ONLY u104)
(define-constant ERR-INVALID-ID u105)
(define-constant ERR-INVALID-BPS u106)

;; Core functions

;; Add minter to whitelist
;; @description Allows the contract owner to add a new address to the minter whitelist
;; @param minter-to-add: Address to add to the whitelist
;; @returns (response bool uint): Returns true on success, or error code on failure
(define-public (add-minter (minter-to-add principal))
  (begin
    (asserts! (is-eq tx-sender contract-owner) (err ERR-OWNER-ONLY))
    (map-set minter-whitelist (tuple (minter minter-to-add)) (tuple (is-allowed true)))
    (ok true)
  )
)

;; Remove minter from whitelist
;; @description Allows the contract owner to remove an address from the minter whitelist
;; @param minter-to-remove: Address to remove from the whitelist
;; @returns (response bool uint): Returns true on success, or error code
(define-public (remove-minter (minter-to-remove principal))
  (begin
    (asserts! (is-eq tx-sender contract-owner) (err ERR-OWNER-ONLY))
    (map-delete minter-whitelist (tuple (minter minter-to-remove)))
    (ok true)
  )
)

;; Mint new NFT
;; @description Allows the contract owner or an authorized address to mint a new sound NFT
;; @param recipient: The recipient of the new NFT
;; @param new-token-uri: The metadata URI for the new NFT (e.g., ipfs://CID)
;; @returns (response uint uint): Returns the new NFT ID on success, or error code on failure
(define-public (mint (recipient principal) (new-token-uri (string-ascii 256)))
  (let (
        (next-id (+ (var-get last-token-id) u1))
        (minter-entry (map-get? minter-whitelist (tuple (minter tx-sender))))
      )
    (asserts! (or 
                (is-eq tx-sender contract-owner) 
                (and 
                  (is-some minter-entry) 
                  (get is-allowed (default-to (tuple (is-allowed false)) minter-entry))
                )
              )
              (err ERR-NOT-AUTHORIZED))
    
    (match (nft-mint? sound-capsule next-id recipient)
      success (begin
        (map-set token-uri-map (tuple (id next-id)) (tuple (uri new-token-uri)))
        (var-set last-token-id next-id)
        (ok next-id)
      )
      error (err error)
    )
  )
)

;; Transfer NFT
;; @description Allows the owner of an NFT to transfer it to someone else
;; @param token-id: The ID of the NFT to transfer
;; @param sender: The current owner
;; @param recipient: The new recipient
;; @returns (response bool uint): Returns true on success, or error code
(define-public (transfer (token-id uint) (sender principal) (recipient principal))
  (begin
    (asserts! (is-sender-owner token-id sender) (err ERR-NOT-AUTHORIZED))
    (nft-transfer? sound-capsule token-id sender recipient)
  )
)

;; Query functions

;; Get NFT owner
;; @description Queries the current owner of a specified NFT ID
;; @param token-id: NFT ID
;; @returns (response principal uint): Returns the owner's address on success, or error code
(define-read-only (get-owner (token-id uint))
  (ok (nft-get-owner? sound-capsule token-id))
)

;; Get NFT metadata URI
;; @description Queries the metadata URI for a specified NFT ID
;; @param token-id: NFT ID
;; @returns (response (optional (string-ascii 256)) uint): Returns the metadata URI or none
(define-read-only (get-token-uri (token-id uint))
  (ok (map-get? token-uri-map (tuple (id token-id))))
)

;; Get NFT balance for an address
;; @description Queries the number of sound-capsule NFTs owned by a specified address
;; @param owner: The address to query
;; @returns uint: The number of NFTs owned by the address
(define-read-only (get-balance (owner principal))
  u0  ;; Simplified implementation, returns fixed value
)

;; Get total minted NFTs
;; @description Returns the ID of the last minted NFT, which indicates the total minted
;; @returns uint: The last NFT ID
(define-read-only (get-last-token-id)
  (var-get last-token-id)
)

;; Helper functions
;; Check if sender is the owner
(define-private (is-sender-owner (token-id uint) (sender principal))
  (let ((owner (nft-get-owner? sound-capsule token-id)))
    (and (is-some owner) (is-eq sender (unwrap-panic owner)))
  )
)

;; Royalty functions (optional)
;; SIP-018 Royalty Standard (https://github.com/stacksgov/sips/blob/main/sips/sip-018/sip-018-royalty-standard.md)

;; Set royalty for NFT
;; @description Allows the contract owner to set royalty information for a specific NFT ID
;; @param token-id: The NFT ID to set royalty for
;; @param royalty-recipient: The address that will receive royalties
;; @param royalty-bps: The royalty percentage in basis points, e.g., u500 for 5%
;; @returns (response bool uint): Returns true on success, or error code
(define-public (set-royalty-for-nft (token-id uint) (royalty-recipient principal) (royalty-bps uint))
  (begin
    (asserts! (is-eq tx-sender contract-owner) (err ERR-OWNER-ONLY))
    (asserts! (<= royalty-bps u10000) (err ERR-INVALID-BPS))

    (map-set nft-royalty-map (tuple (token-id token-id)) (tuple (recipient royalty-recipient) (bps royalty-bps)))
    (ok true)
  )
)

;; Get royalty info
;; @description Adheres to SIP-018, returns royalty recipient and amount for a given sale price
;; @param token-id: NFT ID
;; @param sale-price: The sale price of the NFT
;; @returns (response (tuple (recipient principal) (amount uint)) uint):
;;           On success, returns tuple with royalty recipient and amount.
;;           If no royalty is set, defaults to 0 amount to contract owner.
(define-read-only (get-royalty-info (token-id uint) (sale-price uint))
  (match (map-get? nft-royalty-map (tuple (token-id token-id)))
    royalty-data
      (let ((royalty-amount (/ (* sale-price (get bps royalty-data)) u10000)))
        (ok (tuple (recipient (get recipient royalty-data)) (amount royalty-amount))))
    
    (ok (tuple (recipient contract-owner) (amount u0)))
  )
)
