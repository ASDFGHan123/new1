from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from users.models_organization import Department, Office
from users.department_serializers import DepartmentSerializer, OfficeSerializer


class DepartmentListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        departments = Department.objects.all()
        serializer = DepartmentSerializer(departments, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = DepartmentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DepartmentDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, dept_id):
        try:
            department = Department.objects.get(id=dept_id)
            serializer = DepartmentSerializer(department)
            return Response(serializer.data)
        except Department.DoesNotExist:
            return Response({'error': 'Department not found'}, status=status.HTTP_404_NOT_FOUND)

    def put(self, request, dept_id):
        try:
            department = Department.objects.get(id=dept_id)
            serializer = DepartmentSerializer(department, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Department.DoesNotExist:
            return Response({'error': 'Department not found'}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, dept_id):
        try:
            department = Department.objects.get(id=dept_id)
            action = request.data.get('action', 'trash')
            if action == 'permanent':
                department.delete()
            else:
                department.is_deleted = True
                department.save()
            return Response({'message': 'Department deleted'}, status=status.HTTP_200_OK)
        except Department.DoesNotExist:
            return Response({'error': 'Department not found'}, status=status.HTTP_404_NOT_FOUND)


class DepartmentMembersView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, dept_id):
        try:
            department = Department.objects.get(id=dept_id)
            members = department.users.all()
            from users.serializers import UserSerializer
            serializer = UserSerializer(members, many=True)
            return Response(serializer.data)
        except Department.DoesNotExist:
            return Response({'error': 'Department not found'}, status=status.HTTP_404_NOT_FOUND)


class DepartmentOfficesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, dept_id):
        try:
            department = Department.objects.get(id=dept_id)
            offices = department.offices.all()
            serializer = OfficeSerializer(offices, many=True)
            return Response(serializer.data)
        except Department.DoesNotExist:
            return Response({'error': 'Department not found'}, status=status.HTTP_404_NOT_FOUND)


class OfficeListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = OfficeSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class OfficeDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, office_id):
        try:
            office = Office.objects.get(id=office_id)
            serializer = OfficeSerializer(office)
            return Response(serializer.data)
        except Office.DoesNotExist:
            return Response({'error': 'Office not found'}, status=status.HTTP_404_NOT_FOUND)

    def put(self, request, office_id):
        try:
            office = Office.objects.get(id=office_id)
            serializer = OfficeSerializer(office, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Office.DoesNotExist:
            return Response({'error': 'Office not found'}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, office_id):
        try:
            office = Office.objects.get(id=office_id)
            action = request.data.get('action', 'trash')
            if action == 'permanent':
                office.delete()
            else:
                office.is_deleted = True
                office.save()
            return Response({'message': 'Office deleted'}, status=status.HTTP_200_OK)
        except Office.DoesNotExist:
            return Response({'error': 'Office not found'}, status=status.HTTP_404_NOT_FOUND)
