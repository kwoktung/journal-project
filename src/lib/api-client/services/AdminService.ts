/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class AdminService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * @returns any Cleanup completed successfully
     * @throws ApiError
     */
    public postApiAdminCleanupOrphanedAttachments(): CancelablePromise<{
        success: boolean;
        data: {
            deletedCount: number;
            deletedFilenames: Array<string>;
            errors?: Array<string>;
        };
    }> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/admin/cleanup-orphaned-attachments',
            errors: {
                401: `Unauthorized - Invalid or missing bearer token`,
                500: `Internal server error - Failed to cleanup attachments`,
            },
        });
    }
    /**
     * @returns any Cleanup completed successfully
     * @throws ApiError
     */
    public postApiAdminCleanupDeletedCouples(): CancelablePromise<{
        success: boolean;
        data: {
            message: string;
            deletedCount: number;
            stats: {
                couples: number;
                posts: number;
                attachments: number;
            };
        };
    }> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/admin/cleanup-deleted-couples',
            errors: {
                401: `Unauthorized - Invalid or missing bearer token`,
                500: `Internal server error - Failed to cleanup deleted couples`,
            },
        });
    }
}
