use enigo::{Button, Coordinate, Direction, Enigo, Mouse, Settings};
use std::sync::Mutex;

struct MouseController(Mutex<Enigo>);

#[tauri::command]
fn move_cursor(
    x: i32,
    y: i32,
    controller: tauri::State<'_, MouseController>,
) -> Result<(), String> {
    let mut enigo = controller
        .0
        .lock()
        .map_err(|_| "No se pudo bloquear el controlador del mouse".to_string())?;

    enigo
        .move_mouse(x, y, Coordinate::Abs)
        .map_err(|error| error.to_string())
}

#[tauri::command]
fn click_mouse(controller: tauri::State<'_, MouseController>) -> Result<(), String> {
    let mut enigo = controller
        .0
        .lock()
        .map_err(|_| "No se pudo bloquear el controlador del mouse".to_string())?;

    enigo
        .button(Button::Left, Direction::Click)
        .map_err(|error| error.to_string())
}

#[tauri::command]
fn mouse_down(controller: tauri::State<'_, MouseController>) -> Result<(), String> {
    let mut enigo = controller
        .0
        .lock()
        .map_err(|_| "No se pudo bloquear el controlador del mouse".to_string())?;

    enigo
        .button(Button::Left, Direction::Press)
        .map_err(|error| error.to_string())
}

#[tauri::command]
fn mouse_up(controller: tauri::State<'_, MouseController>) -> Result<(), String> {
    let mut enigo = controller
        .0
        .lock()
        .map_err(|_| "No se pudo bloquear el controlador del mouse".to_string())?;

    enigo
        .button(Button::Left, Direction::Release)
        .map_err(|error| error.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let enigo = Enigo::new(&Settings::default()).expect("error initializing mouse controller");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(MouseController(Mutex::new(enigo)))
        .invoke_handler(tauri::generate_handler![
            move_cursor,
            click_mouse,
            mouse_down,
            mouse_up
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
