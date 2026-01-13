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
    /**
     * @param formData
     * @returns any Attachment created successfully on behalf of user
     * @throws ApiError
     */
    public postApiAdminAttachments(
        formData?: {
            /**
             * The file to upload as an attachment
             */
            file: Record<string, any>;
            /**
             * User ID to create the attachment as
             */
            userId: number;
        },
    ): CancelablePromise<{
        success: boolean;
        data: {
            id: number;
            filename: string;
        };
    }> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/admin/attachments',
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                400: `Bad request - Invalid file or missing userId`,
                401: `Unauthorized - Invalid or missing bearer token`,
                404: `Not found - User not found`,
                500: `Internal server error - Failed to create attachment`,
            },
        });
    }
    /**
     * @param requestBody
     * @returns any Post created successfully on behalf of user
     * @throws ApiError
     */
    public postApiAdminPosts(
        requestBody?: {
            /**
             * User ID to create the post as
             */
            userId: number;
            /**
             * Post text content
             */
            text: string;
            /**
             * Array of attachment IDs to link to the post
             */
            attachmentIds?: Array<number>;
            /**
             * Optional custom creation timestamp (ISO 8601 format). If not provided, uses current time.
             */
            createdAt?: string;
        },
    ): CancelablePromise<{
        success: boolean;
        data: {
            id: number;
            text: string;
            createdBy: number;
            user: any | null;
            createdAt: string;
            updatedAt: string | null;
            attachments: Array<{
                id: number;
                filename: string;
                createdAt: string;
            }>;
        };
    }> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/admin/posts',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad request - Invalid input`,
                401: `Unauthorized - Invalid or missing bearer token`,
                403: `Forbidden - User has no active relationship`,
                404: `Not found - User or attachment IDs not found`,
                500: `Internal server error - Failed to create post`,
            },
        });
    }
}
