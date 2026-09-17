import { useState, useEffect } from 'react';
import { vizion } from '@/api/vizionClient';

export default function useProjects() {
  const [projects, setProjects] = useState([]);
  const [activeId, setActiveId] = useState(localStorage.getItem('activeProjectId') || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vizion.entities.Project.list('-created_date').then((list) => {
      const projectsArray = Array.isArray(list) ? list : (list && list.data ? list.data : []);
      setProjects(projectsArray);
      setActiveId((prev) => (prev && projectsArray.some((p) => p.id === prev) ? prev : projectsArray[0]?.id || ''));
      setLoading(false);
    }).catch((error) => {
      console.error('Failed to load projects:', error);
      setProjects([]);
      setLoading(false);
    });
  }, []);

  const select = (id) => {
    localStorage.setItem('activeProjectId', id);
    setActiveId(id);
  };

  return { projects, loading, activeId, select, active: projects.find((p) => p.id === activeId) };
}