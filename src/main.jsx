import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// 1. Import Reown AppKit and Ethers adapter
import { createAppKit } from '@reown/appkit/react'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { sepolia } from '@reown/appkit/networks'

// 2. Set up the configuration with your Project ID
const projectId = 'a519260b229294a334a85aa7191bd61b'

const metadata = {
  name: 'AgroVault',
  description: 'Blockchain cooperative for farmers and buyers',
  url: 'http://localhost:5173', 
  icons: ['https://avatars.githubusercontent.com/u/37784886'] 
}

// 3. Create the modal instance BEFORE React renders
createAppKit({
  adapters: [new EthersAdapter()],
  networks: [sepolia],
  projectId,
  metadata,
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)