
ALTER TABLE public.appointments
  DROP CONSTRAINT appointments_worker_id_fkey,
  ADD CONSTRAINT appointments_worker_id_fkey
    FOREIGN KEY (worker_id) REFERENCES public.workers(id) ON DELETE SET NULL;
