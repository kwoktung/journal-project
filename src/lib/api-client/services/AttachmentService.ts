/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class AttachmentService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * @param formData
     * @returns any Attachment created successfully
     * @throws ApiError
     */
    public postApiAttachment(
        formData?: {
            /**
             * The file to upload as an attachment (max size: 50MB)
             */
            file: Record<string, any>;
            /**
             * Optional base64-encoded thumbhash for blur placeholder (~25 bytes)
             */
            thumbHash?: string;
        },
    ): CancelablePromise<{
        success: boolean;
        data: {
            id: number;
            filename: string;
            thumbHash: string | null;
        };
    }> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/api/attachment',
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                400: `Bad request - Invalid file, missing file, or file size exceeds 50MB`,
                401: `Unauthorized - Authentication required`,
                500: `Internal server error - Failed to create attachment`,
            },
        });
    }
    /**
     * @param filename The attachment filename to update
     * @param requestBody
     * @returns any ThumbHash updated successfully
     * @throws ApiError
     */
    public patchApiAttachmentThumbhash(
        filename: string,
        requestBody?: {
            /**
             * Base64-encoded thumbhash for blur placeholder (~25 bytes)
             */
            thumbHash: string;
        },
    ): CancelablePromise<{
        success: boolean;
        data: {
            filename: string;
            thumbHash: string;
        };
    }> {
        return this.httpRequest.request({
            method: 'PATCH',
            url: '/api/attachment/{filename}/thumbhash',
            path: {
                'filename': filename,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                401: `Unauthorized - Authentication required`,
                404: `Attachment not found or access denied`,
                500: `Internal server error`,
            },
        });
    }
}
