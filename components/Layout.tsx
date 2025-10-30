import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Menu, X, PenSquare, Home, FolderOpen, User, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Button } from './ui/button';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Sticky Navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <PenSquare className="h-8 w-8 text-blue-600" />
              <span className="text-xl text-gray-900">BlogHub</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/" className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors">
                <Home className="h-5 w-5" />
                <span>Home</span>
              </Link>
              {user && (
                <Link to="/create" className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors">
                  <PenSquare className="h-5 w-5" />
                  <span>Create Post</span>
                </Link>
              )}
              <Link to="/categories" className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors">
                <FolderOpen className="h-5 w-5" />
                <span>Categories</span>
              </Link>
            </div>

            {/* User Menu / Login */}
            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} alt={user.username} />
                        <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="text-gray-900">{user.username}</span>
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </DropdownMenuItem>
                    {user.role === 'admin' && (
                      <DropdownMenuItem onClick={() => navigate('/admin')}>
                        <LayoutDashboard className="h-4 w-4 mr-2" />
                        Dashboard
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center space-x-4">
                  <Button variant="ghost" onClick={() => navigate('/login')}>
                    Login
                  </Button>
                  <Button onClick={() => navigate('/register')}>
                    Sign Up
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-4 space-y-3">
              <Link
                to="/"
                className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Home className="h-5 w-5" />
                <span>Home</span>
              </Link>
              {user && (
                <Link
                  to="/create"
                  className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <PenSquare className="h-5 w-5" />
                  <span>Create Post</span>
                </Link>
              )}
              <Link
                to="/categories"
                className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <FolderOpen className="h-5 w-5" />
                <span>Categories</span>
              </Link>
              {user ? (
                <>
                  <hr className="my-2" />
                  <Link
                    to="/profile"
                    className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="h-5 w-5" />
                    <span>Profile</span>
                  </Link>
                  {user.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <LayoutDashboard className="h-5 w-5" />
                      <span>Dashboard</span>
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 py-2 w-full"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <hr className="my-2" />
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      navigate('/login');
                      setMobileMenuOpen(false);
                    }}
                  >
                    Login
                  </Button>
                  <Button
                    className="w-full"
                    onClick={() => {
                      navigate('/register');
                      setMobileMenuOpen(false);
                    }}
                  >
                    Sign Up
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <PenSquare className="h-6 w-6 text-blue-400" />
                <span className="text-lg">BlogHub</span>
              </div>
              <p className="text-gray-400">
                Share your thoughts, stories, and ideas with the world.
              </p>
            </div>
            <div>
              <h3 className="text-lg mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link to="/" className="hover:text-white transition-colors">Home</Link>
                </li>
                <li>
                  <Link to="/categories" className="hover:text-white transition-colors">Categories</Link>
                </li>
                {user && (
                  <li>
                    <Link to="/create" className="hover:text-white transition-colors">Create Post</Link>
                  </li>
                )}
              </ul>
            </div>
            <div>
              <h3 className="text-lg mb-4">Connect</h3>
              <div className="flex space-x-4 text-gray-400">
                <a href="#" className="hover:text-white transition-colors">Twitter</a>
                <a href="#" className="hover:text-white transition-colors">Facebook</a>
                <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
              </div>
              <button
                onClick={scrollToTop}
                className="mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white transition-colors"
              >
                Back to Top
              </button>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} BlogHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
