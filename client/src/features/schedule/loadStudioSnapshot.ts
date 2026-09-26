import { Booking, CookingClass, ScheduleQuery, StudioApi } from '../../domain/types';

type ReadApi = Pick<StudioApi, 'getClasses' | 'getBookings' | 'getClass'>;

export type StudioSnapshot = {
  scheduleResult: PromiseSettledResult<CookingClass[]>;
  bookingsResult: PromiseSettledResult<Booking[]>;
  detailResults: PromiseSettledResult<CookingClass>[];
};

export async function loadStudioSnapshot(
  api: ReadApi,
  query: ScheduleQuery,
  knownClasses: CookingClass[],
): Promise<StudioSnapshot> {
  const [scheduleResult, bookingsResult] = await Promise.allSettled([
    api.getClasses(query),
    api.getBookings(),
  ]);

  let detailResults: PromiseSettledResult<CookingClass>[] = [];
  if (bookingsResult.status === 'fulfilled') {
    const currentClasses =
      scheduleResult.status === 'fulfilled' ? scheduleResult.value : knownClasses;
    const knownClassIds = new Set(currentClasses.map((item) => item.id));
    const missingClassIds = [
      ...new Set(
        bookingsResult.value
          .map((item) => item.classId)
          .filter((id) => !knownClassIds.has(id)),
      ),
    ];
    detailResults = await Promise.allSettled(
      missingClassIds.map((classId) => api.getClass(classId)),
    );
  }

  return { scheduleResult, bookingsResult, detailResults };
}
