import { useRealtimePatientList } from '@/hooks/useRealtimePatientList';
import { CRDTHelpers } from '@/utils/crdtHelpers';
import { useAuth } from '@/hooks/useAuth';

/**
 * Example component showing how to use the real-time patient list hook
 */
export function RealtimePatientListExample({ listUrlSafeName }: { listUrlSafeName: string }) {
  const { currentTenant } = useAuth();
  const { model, isLoading, error, isConnected, applyLocalChange } = useRealtimePatientList({
    urlSafeName: listUrlSafeName,
    tenantUrlSafeName: currentTenant?.urlSafeName || '',
  });

  if (isLoading) {
    return <div>Loading patient list...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!model) {
    return <div>No data available</div>;
  }

  const data = model.view();
  const patients = data.patients || [];

  const handleAddPatient = () => {
    applyLocalChange((api) => {
      CRDTHelpers.addPatient(api, {
        mrn: '12345',
        dob: '1990-01-01',
        first_name: 'John',
        last_name: 'Doe',
        location: 'Room 101',
      });
    });
  };

  const handleAddTodo = (patientIndex: number) => {
    applyLocalChange((api) => {
      CRDTHelpers.addTodo(api, patientIndex, {
        text: 'New todo item',
        description: '',
        status: 'open',
        createdBy: 'user-id',
      });
    });
  };

  const handleToggleTodo = (patientIndex: number, todoIndex: number) => {
    applyLocalChange((api) => {
      CRDTHelpers.toggleTodoStatus(api, patientIndex, todoIndex, 'user-id');
    });
  };

  const handleUpdatePatientField = (patientIndex: number, field: string, value: string) => {
    applyLocalChange((api) => {
      CRDTHelpers.updatePatientField(api, patientIndex, field, value);
    });
  };

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center gap-2">
        <h1 className="text-2xl font-bold">Patient List: {data.name}</h1>
        <span className={`text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
          {isConnected ? '● Connected' : '○ Disconnected'}
        </span>
      </div>

      <button
        onClick={handleAddPatient}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Add Patient
      </button>

      <div className="space-y-4">
        {patients.map((patient: any, patientIndex: number) => (
          <div key={patient.id} className="border p-4 rounded">
            <div className="grid grid-cols-2 gap-2 mb-2">
              <input
                type="text"
                value={patient.first_name}
                onChange={(e) => handleUpdatePatientField(patientIndex, 'first_name', e.target.value)}
                placeholder="First name"
                className="border px-2 py-1"
              />
              <input
                type="text"
                value={patient.last_name}
                onChange={(e) => handleUpdatePatientField(patientIndex, 'last_name', e.target.value)}
                placeholder="Last name"
                className="border px-2 py-1"
              />
            </div>

            <div className="text-sm text-gray-600 mb-2">
              MRN: {patient.mrn} | DOB: {patient.dob} | Location: {patient.location}
            </div>

            <div className="mt-2">
              <h3 className="font-semibold mb-1">Todos:</h3>
              {patient.todos?.map((todo: any, todoIndex: number) => (
                <div key={todo.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={todo.status === 'CLOSED'}
                    onChange={() => handleToggleTodo(patientIndex, todoIndex)}
                  />
                  <span className={todo.status === 'CLOSED' ? 'line-through' : ''}>
                    {todo.description}
                  </span>
                </div>
              ))}
              <button
                onClick={() => handleAddTodo(patientIndex)}
                className="mt-1 text-sm text-blue-500 hover:underline"
              >
                Add todo
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}