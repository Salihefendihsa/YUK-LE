import { RoleDrawerLayout } from '../../../src/components/navigation/RoleDrawerLayout';

export const unstable_settings = {
  initialRouteName: 'dashboard',
};

export default function CustomerDrawerLayout() {
  return <RoleDrawerLayout role="customer" />;
}
