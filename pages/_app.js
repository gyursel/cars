import '../styles/fonts.css';
import '../styles/apex.css';
import '../styles/mobile-showroom.css';
import { SceneTransitionProvider } from '../hooks/useSceneTransition';
export default function App({ Component, pageProps }) { return <SceneTransitionProvider><Component {...pageProps} /></SceneTransitionProvider>; }
