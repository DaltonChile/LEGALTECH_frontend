import { useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { 
  Bell,
  Shield,
  Database,
  Globe,
  Save,
  CheckCircle
} from 'lucide-react';

export function ConfigurationPage() {
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    siteName: 'Legaltech',
    siteDescription: 'Plataforma de contratos legales',
    contactEmail: 'contacto@legaltech.cl',
    notificationsEnabled: true,
    emailNotifications: true,
    autoBackup: true,
    maintenanceMode: false,
  });

  const handleSave = () => {
    // TODO: Save to backend
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const sections = [
    {
      title: 'General',
      icon: Globe,
      fields: [
        {
          label: 'Nombre del Sitio',
          key: 'siteName',
          type: 'text',
          description: 'Nombre que aparece en el encabezado y correos'
        },
        {
          label: 'Descripción',
          key: 'siteDescription',
          type: 'text',
          description: 'Descripción breve de la plataforma'
        },
        {
          label: 'Email de Contacto',
          key: 'contactEmail',
          type: 'email',
          description: 'Email para soporte y notificaciones'
        }
      ]
    },
    {
      title: 'Notificaciones',
      icon: Bell,
      fields: [
        {
          label: 'Notificaciones Activas',
          key: 'notificationsEnabled',
          type: 'toggle',
          description: 'Habilitar notificaciones en la plataforma'
        },
        {
          label: 'Notificaciones por Email',
          key: 'emailNotifications',
          type: 'toggle',
          description: 'Enviar notificaciones por correo electrónico'
        }
      ]
    },
    {
      title: 'Sistema',
      icon: Database,
      fields: [
        {
          label: 'Respaldo Automático',
          key: 'autoBackup',
          type: 'toggle',
          description: 'Realizar respaldos automáticos diarios'
        },
        {
          label: 'Modo Mantenimiento',
          key: 'maintenanceMode',
          type: 'toggle',
          description: 'Activar modo mantenimiento (solo admins pueden acceder)'
        }
      ]
    }
  ];

  return (
    <AdminLayout>
      <div className="max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Configuración</h1>
            <p className="text-slate-500 mt-1">Ajustes del sistema y preferencias</p>
          </div>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            {saved ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Guardado
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Guardar Cambios
              </>
            )}
          </button>
        </div>

        {/* Settings sections */}
        <div className="space-y-6">
          {sections.map((section) => (
            <div 
              key={section.title}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                  <section.icon className="w-4 h-4 text-slate-600" />
                </div>
                <h2 className="font-semibold text-slate-900">{section.title}</h2>
              </div>
              
              <div className="p-6 space-y-6">
                {section.fields.map((field) => (
                  <div key={field.key} className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-slate-900">
                        {field.label}
                      </label>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {field.description}
                      </p>
                    </div>
                    <div className="shrink-0">
                      {field.type === 'toggle' ? (
                        <button
                          type="button"
                          onClick={() => setSettings({
                            ...settings,
                            [field.key]: !settings[field.key as keyof typeof settings]
                          })}
                          className={`relative w-11 h-6 rounded-full transition-colors ${
                            settings[field.key as keyof typeof settings]
                              ? 'bg-blue-600'
                              : 'bg-slate-200'
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                              settings[field.key as keyof typeof settings]
                                ? 'translate-x-5'
                                : 'translate-x-0'
                            }`}
                          />
                        </button>
                      ) : (
                        <input
                          type={field.type}
                          value={settings[field.key as keyof typeof settings] as string}
                          onChange={(e) => setSettings({
                            ...settings,
                            [field.key]: e.target.value
                          })}
                          className="w-64 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Danger zone */}
        <div className="mt-6 bg-white rounded-xl border border-red-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-red-200 bg-red-50 flex items-center gap-3">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-red-600" />
            </div>
            <h2 className="font-semibold text-red-900">Zona de Peligro</h2>
          </div>
          
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">Eliminar todos los datos</p>
                <p className="text-sm text-slate-500 mt-0.5">
                  Esta acción es irreversible y eliminará todos los contratos y usuarios.
                </p>
              </div>
              <button
                className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
              >
                Eliminar Datos
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
