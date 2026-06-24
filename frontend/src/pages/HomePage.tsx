import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';

const previewDays = [
  { day: 'lun 21', time: '08:30', title: 'Vuelo a Milán', place: 'Terminal 2' },
  { day: 'mar 22', time: '10:00', title: 'Ferry por el lago de Como', place: 'Embarcadero de Varenna' },
  { day: 'mié 23', time: '09:15', title: 'Ruta hacia Dolomitas', place: 'Carretera panorámica' },
  { day: 'jue 24', time: '11:30', title: 'Sendero de Seceda', place: 'Ortisei' },
];

export function HomePage() {
  const { user } = useAuth();
  return (
    <div className="landing">
      <header className="landing-header">
        <Link to="/" className="brand">
          <span className="brand-mark">I</span>
          <span>Itinera</span>
        </Link>
        <div className="landing-actions">
          {user ? (
            <Link className="button primary" to="/dashboard">Abrir panel</Link>
          ) : (
            <>
              <Link className="button ghost" to="/login">Iniciar sesión</Link>
              <Link className="button primary" to="/register">Crear cuenta</Link>
            </>
          )}
        </div>
      </header>
      <main className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Una forma más tranquila de planificar juntos</span>
          <h1>Tu viaje, organizado como las notas que escribirías de forma natural.</h1>
          <p>
            Reúne fechas, horarios y lugares en una vista limpia que puedes editar,
            compartir e imprimir.
          </p>
          <div className="hero-actions">
            <Link className="button primary large" to={user ? '/dashboard' : '/register'}>
              Empezar a planificar
            </Link>
            <a className="button ghost large" href="#preview">Ver el calendario</a>
          </div>
        </div>
        <div id="preview" className="hero-preview" aria-label="Vista previa del calendario">
          {previewDays.map((item, index) => (
            <div className="preview-day" key={item.day}>
              <strong>{item.day}</strong>
              <div className={`preview-card tone-${index + 1}`}>
                <span>{item.time}</span>
                <b>{item.title}</b>
                <small>{item.place}</small>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
