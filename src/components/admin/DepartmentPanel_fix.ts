  const loadDepartmentMembers = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const data = await organizationApi.getDepartmentMembers(departmentId);
      setDepartmentMembers(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error('Error fetching members:', err);
      setErrorMessage(t('departments.failedToLoadMembers'));
    } finally {
      setIsLoading(false);
    }
  };
