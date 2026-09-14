import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the login screen', () => {
  window.history.pushState({}, '', '/inventory-system/');
  render(<App />);
  expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
});
