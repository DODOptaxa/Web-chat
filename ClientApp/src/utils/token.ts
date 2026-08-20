export function getRoleFromToken(token: string): string {
	try {
		const payload = JSON.parse(atob(token.split('.')[1]))
		return (
			payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ??
			payload['role'] ??
			'user'
		)
	} catch {
		return 'user'
	}
}
