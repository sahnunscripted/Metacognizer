import { Outlet } from 'react-router-dom';
import Header from '../Header/Header';
import Navigation from '../Navigation/Navigation';

export default function Layout() {
  return (
    <div className="min-h-screen bg-dark-900 flex flex-col">
      <Header />
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-4 pb-20">
        <Outlet />
      </main>
      <Navigation />
    </div>
  );
}
