import { Model } from 'json-joy/lib/json-crdt/model/Model';
import type { Patient } from '@/models/Patient';

/**
 * CRDT Helper utilities for common operations on patient lists
 */

export class CRDTHelpers {
  /**
   * Validate patient index
   */
  private static validatePatientIndex(api: any, patientIndex: number): void {
    if (patientIndex < 0) {
      throw new Error('Invalid patient index: must be non-negative');
    }
    
    const patientsArray = api.arr(['patients']);
    if (patientIndex >= patientsArray.length()) {
      throw new Error(`Patient index ${patientIndex} out of bounds`);
    }
  }

  /**
   * Add a new patient to the list
   */
  static addPatient(api: any, patient: {
    id?: string;
    mrn: string;
    dob: string;
    first_name?: string;
    last_name?: string;
    location?: string;
    one_liner?: string;
    hpi?: string;
    todos?: any[];
    labs?: any[];
    vitals?: any[];
    meds?: any[];
    assessment_and_plan?: any[];
  }) {
    if (!patient.mrn || patient.mrn.trim() === '') {
      throw new Error('Patient MRN is required');
    }
    
    if (!patient.dob || patient.dob.trim() === '') {
      throw new Error('Patient date of birth is required');
    }
    
    const patientId = patient.id || crypto.randomUUID();
    const patientsArray = api.arr(['patients']);
    
    patientsArray.ins(patientsArray.length(), [{
      id: patientId,
      mrn: patient.mrn,
      dob: patient.dob,
      first_name: patient.first_name || '',
      last_name: patient.last_name || '',
      location: patient.location || '',
      one_liner: patient.one_liner || '',
      hpi: patient.hpi || '',
      todos: patient.todos || [],
      labs: patient.labs || [],
      vitals: patient.vitals || [],
      meds: patient.meds || [],
      assessment_and_plan: patient.assessment_and_plan || [],
    }]);
    
    return patientId;
  }

  /**
   * Update a patient field
   */
  static updatePatientField(
    api: any,
    patientIndex: number,
    field: string,
    value: any
  ) {
    this.validatePatientIndex(api, patientIndex);
    
    if (!field || field.trim() === '') {
      throw new Error('Field name cannot be empty');
    }
    
    // Get the patient object
    const patient = api.obj(['patients', patientIndex]);
    
    // Perform the update
    try {
      // The set() method expects the raw value, not a builder result
      // It will internally call builder.constOrJson() on the value
      patient.set({[field]: value});
    } catch (e) {
      console.error('[CRDTHelpers] Error during set operation:', e);
      throw e;
    }
  }

  /**
   * Add a todo to a patient
   */
  static addTodo(
    api: any,
    patientIndex: number,
    todo: {
      text: string;
      description?: string;
      status?: 'open' | 'complete' | 'hidden';
      tags?: string[];
      dueTime?: {
        type: 'once' | 'n_times' | 'recurring_hours' | 'recurring_days';
        dueDate?: string;
        startDate?: string;
        occurrences?: number;
        completedOccurrences?: number;
        intervalHours?: number;
        intervalDays?: number;
        nextDue?: string;
      };
      createdBy: string;
    }
  ) {
    if (patientIndex < 0) {
      throw new Error('Invalid patient index: must be non-negative');
    }
    
    const patientsArray = api.arr(['patients']);
    if (patientIndex >= patientsArray.length()) {
      throw new Error(`Patient index ${patientIndex} out of bounds`);
    }
    
    if (!todo.text || todo.text.trim() === '') {
      throw new Error('Todo text cannot be empty');
    }
    
    const now = new Date().toISOString();
    const todoId = crypto.randomUUID();
    const todosArray = api.arr(['patients', patientIndex, 'todos']);
    
    todosArray.ins(todosArray.length(), [{
      id: todoId,
      text: todo.text,
      description: todo.description || '',
      status: todo.status || 'open',
      tags: todo.tags || [],
      dueTime: todo.dueTime || {
        type: 'once',
        dueDate: '',
        startDate: '',
        occurrences: 1,
        completedOccurrences: 0,
        intervalHours: 0,
        intervalDays: 0,
        nextDue: '',
      },
      createdAt: now,
      updatedAt: now,
      completedAt: '',
      createdBy: todo.createdBy,
      completedBy: '',
    }]);
    
    return todoId;
  }

  /**
   * Toggle todo status
   */
  static toggleTodoStatus(
    api: any,
    patientIndex: number,
    todoIndex: number,
    userId: string
  ) {
    if (patientIndex < 0 || todoIndex < 0) {
      throw new Error('Invalid index: indices must be non-negative');
    }
    
    const patientsArray = api.arr(['patients']);
    if (patientIndex >= patientsArray.length()) {
      throw new Error(`Patient index ${patientIndex} out of bounds`);
    }
    
    const todosArray = api.arr(['patients', patientIndex, 'todos']);
    if (todoIndex >= todosArray.length()) {
      throw new Error(`Todo index ${todoIndex} out of bounds`);
    }
    
    const todo = api.obj(['patients', patientIndex, 'todos', todoIndex]);
    const currentStatus = todo.get(['status'])?.val;
    const now = new Date().toISOString();
    
    if (currentStatus === 'open') {
      todo.set({
        status: 'complete',
        completedAt: now,
        completedBy: userId,
        updatedAt: now
      });
    } else if (currentStatus === 'complete') {
      todo.set({
        status: 'open',
        completedAt: '',
        completedBy: '',
        updatedAt: now
      });
    }
  }

  /**
   * Remove a todo
   */
  static removeTodo(
    api: any,
    patientIndex: number,
    todoIndex: number
  ) {
    if (patientIndex < 0 || todoIndex < 0) {
      throw new Error('Invalid index: indices must be non-negative');
    }
    
    const patientsArray = api.arr(['patients']);
    if (patientIndex >= patientsArray.length()) {
      throw new Error(`Patient index ${patientIndex} out of bounds`);
    }
    
    const todosArray = api.arr(['patients', patientIndex, 'todos']);
    if (todoIndex >= todosArray.length()) {
      throw new Error(`Todo index ${todoIndex} out of bounds`);
    }
    
    todosArray.del(todoIndex, 1);
  }

  /**
   * Update todo field
   */
  static updateTodo(
    api: any,
    patientIndex: number,
    todoIndex: number,
    updates: Partial<{
      text: string;
      description: string;
      status: 'open' | 'complete' | 'hidden';
      tags: string[];
      dueTime: {
        type: 'once' | 'n_times' | 'recurring_hours' | 'recurring_days';
        dueDate?: string;
        startDate?: string;
        occurrences?: number;
        completedOccurrences?: number;
        intervalHours?: number;
        intervalDays?: number;
        nextDue?: string;
      };
    }>
  ) {
    if (patientIndex < 0 || todoIndex < 0) {
      throw new Error('Invalid index: indices must be non-negative');
    }
    
    const patientsArray = api.arr(['patients']);
    if (patientIndex >= patientsArray.length()) {
      throw new Error(`Patient index ${patientIndex} out of bounds`);
    }
    
    const todosArray = api.arr(['patients', patientIndex, 'todos']);
    if (todoIndex >= todosArray.length()) {
      throw new Error(`Todo index ${todoIndex} out of bounds`);
    }
    
    const now = new Date().toISOString();
    // Set the new values with updated timestamp
    api.obj(['patients', patientIndex, 'todos', todoIndex]).set({
      ...updates,
      updatedAt: now
    });
  }

  /**
   * Add a lab result
   */
  static addLab(
    api: any,
    patientIndex: number,
    lab: {
      display_name: string;
      units: string;
      display_value: string;
      effective_datetime: string;
      value_number?: number;
      value_string?: string;
      reference_range?: any;
    }
  ) {
    const labId = crypto.randomUUID();
    const labsArray = api.arr(['patients', patientIndex, 'labs']);
    
    labsArray.ins(labsArray.length(), [{
      id: labId,
      display_name: lab.display_name,
      units: lab.units,
      display_value: lab.display_value,
      effective_datetime: lab.effective_datetime,
      value_number: lab.value_number,
      value_string: lab.value_string,
      reference_range: lab.reference_range,
      identifiers: [],
    }]);
    
    return labId;
  }

  /**
   * Add a vital sign
   */
  static addVital(
    api: any,
    patientIndex: number,
    vital: {
      display_name: string;
      units: string;
      display_value: string;
      effective_datetime: string;
      value_number?: number;
      value_string?: string;
      reference_range?: any;
    }
  ) {
    const vitalId = crypto.randomUUID();
    const vitalsArray = api.arr(['patients', patientIndex, 'vitals']);
    
    vitalsArray.ins(vitalsArray.length(), [{
      id: vitalId,
      display_name: vital.display_name,
      units: vital.units,
      display_value: vital.display_value,
      effective_datetime: vital.effective_datetime,
      value_number: vital.value_number,
      value_string: vital.value_string,
      reference_range: vital.reference_range,
      identifiers: [],
    }]);
    
    return vitalId;
  }

  /**
   * Add a medication
   */
  static addMed(
    api: any,
    patientIndex: number,
    med: {
      name: string;
      route: string;
      frequency: string;
      dose: string | number;
      unit: string;
    }
  ) {
    const medId = crypto.randomUUID();
    const medsArray = api.arr(['patients', patientIndex, 'meds']);
    
    medsArray.ins(medsArray.length(), [{
      id: medId,
      name: med.name,
      route: med.route,
      frequency: med.frequency,
      dose: med.dose,
      unit: med.unit,
    }]);
    
    return medId;
  }

  /**
   * Add assessment and plan item
   */
  static addAssessmentPlan(
    api: any,
    patientIndex: number,
    item: {
      assessment: string;
      plan: string[];
      category?: string;
    }
  ) {
    const itemId = crypto.randomUUID();
    const apArray = api.arr(['patients', patientIndex, 'assessment_and_plan']);
    
    apArray.ins(apArray.length(), [{
      id: itemId,
      assessment: item.assessment,
      plan: item.plan,
      category: item.category || '',
    }]);
    
    return itemId;
  }

  /**
   * Remove a patient
   */
  static removePatient(api: any, patientIndex: number) {
    this.validatePatientIndex(api, patientIndex);
    
    const patientsArray = api.arr(['patients']);
    patientsArray.del(patientIndex, 1);
  }

  /**
   * Update list metadata
   */
  static updateListMetadata(
    api: any,
    field: 'name' | 'display_template_id',
    value: string
  ) {
    api.obj([]).set({[field]: value});
    const dateStr = new Date().toISOString();
    api.obj([]).set({updated_at: dateStr});
  }

  /**
   * Find patient index by ID
   */
  static findPatientIndex(model: Model<any>, patientId: string): number {
    const patients = (model.view() as any).patients;
    if (!Array.isArray(patients)) return -1;
    
    return patients.findIndex((p: any) => p.id === patientId);
  }

  /**
   * Find todo index by ID
   */
  static findTodoIndex(model: Model<any>, patientIndex: number, todoId: string): number {
    const todos = (model.view() as any).patients?.[patientIndex]?.todos;
    if (!Array.isArray(todos)) return -1;
    
    return todos.findIndex((t: any) => t.id === todoId);
  }

  /**
   * Complete a recurring todo and create next occurrence if needed
   */
  static completeRecurringTodo(
    api: any,
    patientIndex: number,
    todoIndex: number,
    userId: string
  ) {
    if (patientIndex < 0 || todoIndex < 0) {
      throw new Error('Invalid index: indices must be non-negative');
    }
    
    const patientsArray = api.arr(['patients']);
    if (patientIndex >= patientsArray.length()) {
      throw new Error(`Patient index ${patientIndex} out of bounds`);
    }
    
    const todosArray = api.arr(['patients', patientIndex, 'todos']);
    if (todoIndex >= todosArray.length()) {
      throw new Error(`Todo index ${todoIndex} out of bounds`);
    }
    
    const todoData = (api.view() as any).patients[patientIndex].todos[todoIndex];
    const now = new Date();
    const nowISO = now.toISOString();
    
    // Update the current todo
    const todo = api.obj(['patients', patientIndex, 'todos', todoIndex]);
    
    if (todoData.dueTime?.type === 'n_times') {
      const completedOccurrences = (todoData.dueTime.completedOccurrences || 0) + 1;
      const occurrences = todoData.dueTime.occurrences || 1;
      
      if (completedOccurrences < occurrences) {
        // Update completed occurrences
        todo.set({
          dueTime: {
            ...todoData.dueTime,
            completedOccurrences
          },
          updatedAt: nowISO
        });
      } else {
        // Mark as complete
        todo.set({
          status: 'complete',
          completedAt: nowISO,
          completedBy: userId,
          updatedAt: nowISO,
          dueTime: {
            ...todoData.dueTime,
            completedOccurrences
          }
        });
      }
    } else if (todoData.dueTime?.type === 'recurring_hours' || todoData.dueTime?.type === 'recurring_days') {
      // Calculate next due
      let nextDue: Date;
      if (todoData.dueTime.type === 'recurring_hours') {
        nextDue = new Date(now.getTime() + (todoData.dueTime.intervalHours || 0) * 60 * 60 * 1000);
      } else {
        nextDue = new Date(now.getTime() + (todoData.dueTime.intervalDays || 0) * 24 * 60 * 60 * 1000);
      }
      
      // Update the existing todo with new due time and reset status
      todo.set({
        status: 'open',
        dueTime: {
          ...todoData.dueTime,
          nextDue: nextDue.toISOString()
        },
        updatedAt: nowISO,
        completedAt: '',
        completedBy: ''
      });
    } else {
      // One-time todo - just mark as complete
      todo.set({
        status: 'complete',
        completedAt: nowISO,
        completedBy: userId,
        updatedAt: nowISO
      });
    }
  }

  /**
   * Get all patients from the model
   */
  static getPatients(model: Model<any>): Patient[] {
    const view = model.view();
    return (view as any).patients || [];
  }

  /**
   * Update assessment and plan
   */
  static updateAssessmentAndPlan(
    api: any,
    patientIndex: number,
    assessmentIndex: number,
    field: 'assessment' | 'plan',
    value: string,
    planIndex?: number
  ): void {
    if (patientIndex < 0 || assessmentIndex < 0) {
      throw new Error('Invalid index: indices must be non-negative');
    }
    
    const patientsArray = api.arr(['patients']);
    if (patientIndex >= patientsArray.length()) {
      throw new Error(`Patient index ${patientIndex} out of bounds`);
    }
    
    const apArray = api.arr(['patients', patientIndex, 'assessment_and_plan']);
    if (assessmentIndex >= apArray.length()) {
      throw new Error(`Assessment index ${assessmentIndex} out of bounds`);
    }

    if (field === 'assessment') {
      const assessmentObj = api.obj(['patients', patientIndex, 'assessment_and_plan', assessmentIndex]);
      assessmentObj.set({assessment: value});
    } else if (field === 'plan' && planIndex !== undefined) {
      const planArray = api.arr(['patients', patientIndex, 'assessment_and_plan', assessmentIndex, 'plan']);
      
      if (planIndex >= planArray.length()) {
        throw new Error(`Plan index ${planIndex} out of bounds`);
      }
      
      // Replace the plan item at the specific index
      planArray.del(planIndex, 1);
      planArray.ins(planIndex, [value]);
    }
  }
}