// app/admin/page.tsx
import { redirect } from 'next/navigation';

export default async function AdminRootPage() {
  redirect('/admin/dashboard');
}