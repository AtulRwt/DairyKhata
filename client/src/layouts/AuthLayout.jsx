import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white text-xl font-bold">🥛</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">
              Dairy<span className="text-green-600">Khata</span>
            </h1>
          </div>
          <p className="text-sm text-gray-500">Digital Milk Register</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
