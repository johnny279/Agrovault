function WalletPicker({ wallets, onSelect, onClose }) {
  return (
    <div className="wallet-picker-overlay" onClick={onClose}>
      <div className="wallet-picker" onClick={(e) => e.stopPropagation()}>
        <h3>Choose a wallet</h3>
        <div className="wallet-picker-list">
          {wallets.map((wallet) => (
            <button
              key={wallet.info.uuid}
              className="wallet-picker-item"
              onClick={() => onSelect(wallet.provider)}
            >
              <img src={wallet.info.icon} alt={wallet.info.name} width="24" height="24" />
              <span>{wallet.info.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default WalletPicker;