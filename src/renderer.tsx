import { App } from './App';
import './index.css';
import { createRoot } from 'react-dom/client'

const container = document.getElementById("root")
if (!container) {
    throw new Error('No such element with ID \'root\'')
}

const root = createRoot(container)

root.render(<App/>)
