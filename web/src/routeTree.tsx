import {
  createRootRoute,
  createRoute,
  Outlet,
  Link,
} from '@tanstack/react-router';
import { RequestList } from './routes/RequestList';
import { NewRequest } from './routes/NewRequest';
import { RequestDetail } from './routes/RequestDetail';

// Root Layout
const rootRoute = createRootRoute({
  component: () => (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-800">休暇申請システム</h1>
            <div className="flex gap-4">
              <Link
                to="/"
                className="text-gray-600 hover:text-gray-800 [&.active]:text-blue-600 [&.active]:font-semibold"
              >
                申請一覧
              </Link>
              <Link
                to="/new"
                className="text-gray-600 hover:text-gray-800 [&.active]:text-blue-600 [&.active]:font-semibold"
              >
                新規申請
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  ),
});

// Index Route - 申請一覧
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: RequestList,
});

// New Request Route - 新規申請
const newRequestRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/new',
  component: NewRequest,
});

// Request Detail Route - 申請詳細
const requestDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/requests/$id',
  component: RequestDetail,
});

export const routeTree = rootRoute.addChildren([
  indexRoute,
  newRequestRoute,
  requestDetailRoute,
]);
