"""
Custom exception handlers for the delivery platform API.
"""
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import APIException
from django.core.exceptions import ValidationError as DjangoValidationError
from django.http import Http404
import logging

logger = logging.getLogger(__name__)


class CustomAPIException(APIException):
    """
    Base class for custom API exceptions.
    """
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'A server error occurred.'
    default_code = 'error'

    def __init__(self, detail=None, code=None, status_code=None):
        if status_code is not None:
            self.status_code = status_code
        super().__init__(detail, code)


def custom_exception_handler(exc, context):
    """
    Custom exception handler that provides consistent error responses.
    
    Standardizes all error responses with the following format:
    {
        "error": "<human-readable message>",
        "status": <int>,  # Optional, for additional context
        "details": {<field-specific errors>}  # Optional, for validation errors
    }
    """
    # Handle Django's Http404
    if isinstance(exc, Http404):
        return Response(
            {'error': 'The requested resource was not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Handle Django's ValidationError
    if isinstance(exc, DjangoValidationError):
        if hasattr(exc, 'message_dict'):
            # Multiple field errors
            return Response(
                {
                    'error': 'Validation error occurred.',
                    'details': exc.message_dict
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        else:
            # Single error message
            return Response(
                {'error': str(exc)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)
    
    if response is not None:
        # Customize the response data to match our standard format
        custom_response_data = {}
        
        # Format error message
        if hasattr(exc, 'detail'):
            if isinstance(exc.detail, dict):
                # Field-specific validation errors
                formatted_errors = _format_validation_errors(exc.detail)
                
                # Extract general message
                if 'detail' in exc.detail:
                    custom_response_data['error'] = str(exc.detail['detail'])
                elif 'non_field_errors' in exc.detail:
                    errors = exc.detail['non_field_errors']
                    custom_response_data['error'] = str(errors[0]) if errors else 'Validation error occurred.'
                else:
                    # Use first field error as message
                    first_field = next(iter(formatted_errors.keys()))
                    first_error = formatted_errors[first_field]
                    if isinstance(first_error, list) and first_error:
                        custom_response_data['error'] = f"{first_field}: {first_error[0]}"
                    else:
                        custom_response_data['error'] = 'Validation error occurred.'
                
                # Add field-specific errors if present
                if formatted_errors:
                    custom_response_data['details'] = formatted_errors
                    
            elif isinstance(exc.detail, list):
                # List of errors
                custom_response_data['error'] = str(exc.detail[0]) if exc.detail else str(exc)
                if len(exc.detail) > 1:
                    custom_response_data['details'] = [str(e) for e in exc.detail]
            else:
                # Single error message
                custom_response_data['error'] = str(exc.detail)
        else:
            custom_response_data['error'] = str(exc)
        
        # Add status code for server errors (5xx) for debugging
        if response.status_code >= 500:
            custom_response_data['status'] = response.status_code
        
        response.data = custom_response_data
        
        # Log errors at appropriate levels
        if response.status_code >= 500:
            logger.error(
                f"Server error: {custom_response_data['error']}",
                exc_info=True,
                extra={
                    'context': context,
                    'status_code': response.status_code,
                    'user': getattr(context.get('request'), 'user', None),
                    'path': getattr(context.get('request'), 'path', None),
                }
            )
        elif response.status_code >= 400:
            logger.warning(
                f"Client error: {custom_response_data['error']}",
                extra={
                    'status_code': response.status_code,
                    'user': getattr(context.get('request'), 'user', None),
                    'path': getattr(context.get('request'), 'path', None),
                }
            )
    else:
        # Handle unexpected exceptions
        logger.error(
            f"Unhandled exception: {exc}",
            exc_info=True,
            extra={
                'context': context,
                'user': getattr(context.get('request'), 'user', None),
                'path': getattr(context.get('request'), 'path', None),
            }
        )
        response = Response(
            {
                'error': 'An unexpected error occurred. Please try again later.',
                'status': status.HTTP_500_INTERNAL_SERVER_ERROR
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    return response


def _format_validation_errors(errors):
    """
    Format validation errors into a consistent structure.
    
    Converts DRF's nested error structure into a flat dictionary
    where each field maps to a list of error messages.
    """
    formatted = {}
    
    for field, error_list in errors.items():
        if isinstance(error_list, dict):
            # Nested errors (e.g., for nested serializers)
            nested = _format_validation_errors(error_list)
            for nested_field, nested_errors in nested.items():
                formatted[f"{field}.{nested_field}"] = nested_errors
        elif isinstance(error_list, list):
            # Convert ErrorDetail objects to strings
            formatted[field] = [str(e) for e in error_list]
        else:
            # Single error
            formatted[field] = [str(error_list)]
    
    return formatted