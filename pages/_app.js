import '../styles/hero-fix.css';
import LogoManager from '../lib/LogoManager';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <LogoManager />
    </>
  );
}
