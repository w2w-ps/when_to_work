package com.wavemaker.when_to_work.getShiftDetails.service;


import com.wavemaker.when_to_work.getShiftDetails.model.*;
import com.wavemaker.when_to_work.getShiftDetails.model.RootResponse;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.lang.Object;
import org.springframework.util.MultiValueMap;
import feign.*;

public interface GetShiftDetailsService {

  /**
   * 
   * 
    * @param id  (required)
    * @param ngrok_skip_browser_warning ngrok-skip-browser-warning (optional)
   * @return RootResponse
   */
  @RequestLine("GET /scheduling/shifts/{id}")
  @Headers({
    "Accept: application/json",
    "ngrok-skip-browser-warning: {ngrok_skip_browser_warning}"  })
  RootResponse invoke(@Param("id") String id, @Param("ngrok_skip_browser_warning") String ngrok_skip_browser_warning);

}
