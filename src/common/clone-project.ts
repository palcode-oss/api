import path from 'path';
import { getBucket } from '../helpers';

export const cloneProject = async (schoolId: string, sourceId: string, newId: string) => {
    const sourceProjectPath = path.join(sourceId);
    const bucket = getBucket(schoolId);
    const [files] = await bucket.getFiles({
        prefix: sourceProjectPath,
    });

    if (files.length === 0) {
        return;
    }

    for (const file of files) {
        const strippedFileName = file.name.substring(
            sourceProjectPath.length,
        );

        try {
            await file.copy(
                path.join(newId, strippedFileName),
            );
        } catch (e) {}
    }
}
