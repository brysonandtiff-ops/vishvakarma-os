import { describe, expect, it, vi } from 'vitest';
import { PRIVATE_WELCOME_SCENES, isDesignatedWelcomeUser, WELCOME_STORAGE_PREFIX } from '@/welcome/PrivateWelcomeCinematic';

vi.mock('@/contexts/AuthContext',()=>({useAuth:()=>({user:null,profile:null,loading:false})}));

describe('private cinematic onboarding is source truthful',()=>{
  it('is restricted to authenticated user identities from the designated allowlist',()=>{
    expect(isDesignatedWelcomeUser(null)).toBe(false);
    expect(isDesignatedWelcomeUser({id:'',email:'ajkdentureventure@gmail.com'})).toBe(false);
    expect(isDesignatedWelcomeUser({id:'uid',email:'someone@example.org'})).toBe(false);
    expect(isDesignatedWelcomeUser({id:'uid',email:'ajkdentureventure@gmail.com'})).toBe(true);
  });
  it('has real internal routes and an explicit historic world record disclaimer',()=>{
    expect(PRIVATE_WELCOME_SCENES.length).toBeGreaterThanOrEqual(8);
    expect(PRIVATE_WELCOME_SCENES.map(x=>x.path)).toContain('/projects');
    expect(PRIVATE_WELCOME_SCENES.map(x=>x.path)).toContain('/editor-lite');
    expect(PRIVATE_WELCOME_SCENES.map(x=>x.path)).toContain('/3d-room');
    expect(PRIVATE_WELCOME_SCENES.map(x=>x.path)).toContain('/world-records');
    const record=PRIVATE_WELCOME_SCENES.find(x=>x.key==='records');
    expect(record?.caption).toContain('not an official Guinness record');
    expect(record?.narration.toLowerCase()).toContain('not certified');
    expect(PRIVATE_WELCOME_SCENES.filter(x=>x.visual).every(x=>x.visualLabel?.includes('not'))).toBe(true);
  });
  it('has versioned per-user local replay/seen key',()=>{
    expect(WELCOME_STORAGE_PREFIX).toContain('private-welcome-v1');
  });
});
