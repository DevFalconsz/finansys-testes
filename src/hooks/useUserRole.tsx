import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

type UserRole = 'admin' | 'analista' | 'caixa' | 'contador' | 'user' | null;

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching user role:', error);
          setRole('user');
        } else if (data && data.length > 0) {
          // Priority order: admin > contador > analista > caixa > user
          const rolePriority: Record<string, number> = {
            admin: 5,
            contador: 4,
            analista: 3,
            caixa: 2,
            user: 1
          };
          
          const highestRole = data.reduce((highest, current) => {
            const currentPriority = rolePriority[current.role] || 0;
            const highestPriority = rolePriority[highest.role] || 0;
            return currentPriority > highestPriority ? current : highest;
          });
          
          setRole(highestRole.role as UserRole);
        } else {
          setRole('user');
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        setRole('user');
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  return { role, loading };
};
