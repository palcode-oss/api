import { getFirebaseSingleton } from '../helpers';
import { Perms, Project, ProjectAccessLevel, ProjectStatus, ProjectType, User, WithId } from '../types';
import type { auth } from 'firebase-admin';

const admin = getFirebaseSingleton();

export const getUserData = async (authToken: string): Promise<[
    WithId<User> | undefined,
    auth.DecodedIdToken | undefined
]> => {
    let decodedToken;
    try {
        decodedToken = await admin.auth().verifyIdToken(authToken, true);
    } catch (e) {
        return [undefined, undefined];
    }

    const userResponse = await admin.firestore()
        .collection('users')
        .doc(decodedToken.uid)
        .get();

    const userData = userResponse.data() as User;
    if (!userData) {
        return [undefined, decodedToken];
    }

    return [{
        id: decodedToken.uid,
        ...userData,
    }, decodedToken];
}

export const checkPerms = async (authToken: string, perms: Perms) => {
    const [user] = await getUserData(authToken);
    return user && user.perms >= perms;
}

export const checkProjectAccess = async (
    authToken: string,
    projectId: string
): Promise<ProjectAccessLevel> => {
    const [user] = await getUserData(authToken);
    if (!user) return ProjectAccessLevel.None;

    const projectResponse = await admin.firestore()
        .collection('tasks')
        .doc(projectId)
        .get();

    const project = projectResponse.data() as Project;

    if (!project) return ProjectAccessLevel.None;

    if (project.type === ProjectType.Private) {
        if (project.createdBy === user.id || user.perms === 2) {
            return ProjectAccessLevel.Write;
        } else if (user.perms === 1) {
            return ProjectAccessLevel.Read;
        } else {
            return ProjectAccessLevel.None;
        }
    }

    if (project.type === ProjectType.Submission) {
        if (project.createdBy === user.id) {
            if (project.status === ProjectStatus.Submitted) {
                return ProjectAccessLevel.Read;
            } else {
                return ProjectAccessLevel.Write;
            }
        } else if (user.perms >= 1) {
            return ProjectAccessLevel.Write;
        } else {
            return ProjectAccessLevel.None;
        }
    }

    if (project.type === ProjectType.Template) {
        if (project.createdBy === user.id) {
            return ProjectAccessLevel.Write;
        }

        const projectAuthorResponse = await admin.firestore()
            .collection('users')
            .doc(project.createdBy)
            .get();

        const projectAuthor = projectAuthorResponse.data() as User;
        if (!projectAuthor) return ProjectAccessLevel.None;

        if (projectAuthor.schoolId === user.schoolId) {
            return ProjectAccessLevel.Read;
        } else {
            return ProjectAccessLevel.None;
        }
    }

    return ProjectAccessLevel.None;
}

export const isRequestedAccessAllowed = async (
    authToken: string,
    projectId: string,
    access: ProjectAccessLevel,
): Promise<boolean> => {
    const permission = await checkProjectAccess(authToken, projectId);
    return permission >= access;
}
