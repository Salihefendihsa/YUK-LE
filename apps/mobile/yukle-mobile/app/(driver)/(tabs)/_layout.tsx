import { RoleDrawerLayout } from '../../../src/components/navigation/RoleDrawerLayout';

export const unstable_settings = {
  initialRouteName: 'dashboard',
};

export default function DriverDrawerLayout() {
  return <RoleDrawerLayout role="driver" />;
}
