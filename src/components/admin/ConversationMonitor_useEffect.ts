  useEffect(() => {
    const handleStatusChange = (event: any) => {
      const { user_id, online_status } = event.detail;
      setSelectedParticipants(prev => 
        prev.map(p => 
          p.id === user_id ? { ...p, online_status } : p
        )
      );
    };

    window.addEventListener('userStatusChange', handleStatusChange);
    return () => window.removeEventListener('userStatusChange', handleStatusChange);
  }, []);
