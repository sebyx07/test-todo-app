// Mount. Keep trivial — testable code lives in App.tsx and below.
import { render } from 'solid-js/web';
import { App } from './App';
import './styles/index.scss';

const root = document.getElementById('root');
if (!root) throw new Error('#root missing from index.html');

render(() => <App />, root);
